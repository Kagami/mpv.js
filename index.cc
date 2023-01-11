#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <locale.h>
#include <string>
#include <vector>
#include <unordered_map>
#define GL_GLEXT_PROTOTYPES
#include <GLES2/gl2.h>
#include <GLES2/gl2ext.h>
#include <ppapi/cpp/module.h>
#include <ppapi/cpp/instance.h>
#include <ppapi/cpp/var.h>
#include <ppapi/cpp/var_dictionary.h>
#include <ppapi/cpp/graphics_3d.h>
#include <ppapi/lib/gl/gles2/gl2ext_ppapi.h>
#include <ppapi/utility/completion_callback_factory.h>
#include <mpv/client.h>
#include <mpv/render_gl.h>

// Fix for MSVS.
#ifdef PostMessage
#undef PostMessage
#endif

#define QUOTE(arg) #arg
#define DIE(msg) { fprintf(stderr, "%s\n", msg); return false; }
#define GLCB(name) { QUOTE(gl##name), reinterpret_cast<void*>(gl##name) }

using pp::Var;

// Strip GL_EXT_texture_norm16 because it doesn't work but reported as
// available in Chrome 61-64 (electron 2.x) thus broking e.g. 10-bit
// videos in mpv.
// Note that we have a small memory leak here because no one frees copy
// of extension string but it shouldn't be a problem because this is
// only called once at start.
const GLubyte* myGetString(GLenum name) {
  if (name == GL_EXTENSIONS) {
    const char* exts = reinterpret_cast<const char*>(glGetString(name));
    const char* sub = strstr(exts, " GL_EXT_texture_norm16");
    if (!sub)
      return reinterpret_cast<const GLubyte*>(exts);
    char* my_exts = strdup(exts);
    strcpy(my_exts + (sub - exts), sub + 22/*len of ext + space*/);
    return reinterpret_cast<const GLubyte*>(my_exts);
  } else {
    return glGetString(name);
  }
}

// PPAPI GLES implementation doesn't provide getProcAddress.
static const std::unordered_map<std::string, void*> GL_CALLBACKS = {
  { "glGetString", reinterpret_cast<void*>(myGetString) },
  GLCB(ActiveTexture),
  GLCB(AttachShader),
  GLCB(BindAttribLocation),
  GLCB(BindBuffer),
  GLCB(BindTexture),
  GLCB(BlendFuncSeparate),
  GLCB(BufferData),
  GLCB(BufferSubData),
  GLCB(Clear),
  GLCB(ClearColor),
  GLCB(CompileShader),
  GLCB(CreateProgram),
  GLCB(CreateShader),
  GLCB(DeleteBuffers),
  GLCB(DeleteProgram),
  GLCB(DeleteShader),
  GLCB(DeleteTextures),
  GLCB(Disable),
  GLCB(DisableVertexAttribArray),
  GLCB(DrawArrays),
  GLCB(Enable),
  GLCB(EnableVertexAttribArray),
  GLCB(Finish),
  GLCB(Flush),
  GLCB(GenBuffers),
  GLCB(GenTextures),
  GLCB(GetAttribLocation),
  GLCB(GetError),
  GLCB(GetIntegerv),
  GLCB(GetProgramInfoLog),
  GLCB(GetProgramiv),
  GLCB(GetShaderInfoLog),
  GLCB(GetShaderiv),
  GLCB(GetString),
  GLCB(GetUniformLocation),
  GLCB(LinkProgram),
  GLCB(PixelStorei),
  GLCB(ReadPixels),
  GLCB(Scissor),
  GLCB(ShaderSource),
  GLCB(TexImage2D),
  GLCB(TexParameteri),
  GLCB(TexSubImage2D),
  GLCB(Uniform1f),
  GLCB(Uniform2f),
  GLCB(Uniform3f),
  GLCB(Uniform1i),
  GLCB(UniformMatrix2fv),
  GLCB(UniformMatrix3fv),
  GLCB(UseProgram),
  GLCB(VertexAttribPointer),
  GLCB(Viewport),
  GLCB(BindFramebuffer),
  GLCB(GenFramebuffers),
  GLCB(DeleteFramebuffers),
  GLCB(CheckFramebufferStatus),
  GLCB(FramebufferTexture2D),
  GLCB(GetFramebufferAttachmentParameteriv),
  GLCB(GenQueriesEXT),
  GLCB(DeleteQueriesEXT),
  GLCB(BeginQueryEXT),
  GLCB(EndQueryEXT),
  // Few functions are not available in PPAPI or doesn't work properly.
  {"glQueryCounterEXT", NULL},
  GLCB(IsQueryEXT),
  {"glGetQueryObjectivEXT", NULL},
  {"glGetQueryObjecti64vEXT", NULL},
  GLCB(GetQueryObjectuivEXT),
  {"glGetQueryObjectui64vEXT", NULL},
  {"glGetTranslatedShaderSourceANGLE", NULL}
};

class MPVInstance : public pp::Instance {
 public:
  explicit MPVInstance(PP_Instance instance)
      : pp::Instance(instance),
        callback_factory_(this),
        mpv_(NULL),
        mpv_gl_(NULL),
        width_(0),
        height_(0),
        gl_ready_(false),
        is_painting_(false),
        needs_paint_(false) {}

  virtual ~MPVInstance() {
    if (mpv_gl_) {
      glSetCurrentContextPPAPI(context_.pp_resource());
      mpv_render_context_free(mpv_gl_);
    }
    mpv_terminate_destroy(mpv_);
  }

  virtual bool Init(uint32_t, const char**, const char**) {
    if (!InitGL())
      return false;
    if (!InitMPV())
      return false;
    return true;
  }

  virtual void DidChangeView(const pp::View& view) {
    int32_t new_width = static_cast<int32_t>(
        view.GetRect().width() * view.GetDeviceScale());
    int32_t new_height = static_cast<int32_t>(
        view.GetRect().height() * view.GetDeviceScale());
    // printf("@@@ RESIZE %d %d\n", new_width, new_height);

    // Always called on main thread so don't need locks.
    context_.ResizeBuffers(new_width, new_height);
    width_ = new_width;
    height_ = new_height;

    if (!gl_ready_) {
      gl_ready_ = true;
      LoadMPV();
    }
    OnGetFrame(0);
  }

  virtual void HandleMessage(const Var& msg) {
    if (!gl_ready_)
      return;

    pp::VarDictionary dict(msg);
    std::string type = dict.Get("type").AsString();
    pp::Var data = dict.Get("data");

    if (type == "command") {
      pp::VarArray args(data);
      uint32_t len = args.GetLength();
      std::vector<std::string> args_str(len);
      std::vector<const char*> args_ptr(len + 1);
      for (uint32_t i = 0; i < len; i++) {
        args_str[i] = args.Get(i).AsString();
        args_ptr[i] = args_str[i].c_str();
      }
      args_ptr[len] = NULL;
      mpv_command(mpv_, args_ptr.data());
    } else if (type == "set_property") {
      pp::VarDictionary data_dict(data);
      std::string name = data_dict.Get("name").AsString();
      pp::Var value = data_dict.Get("value");
      if (value.is_string()) {
        std::string value_string = value.AsString();
        const char* value_cstr = value_string.c_str();
        mpv_set_property(mpv_, name.c_str(), MPV_FORMAT_STRING, &value_cstr);
      } else if (value.is_bool()) {
        int value_bool = value.AsBool();
        mpv_set_property(mpv_, name.c_str(), MPV_FORMAT_FLAG, &value_bool);
      } else if (value.is_int()) {
        int64_t value_int = value.AsInt();
        mpv_set_property(mpv_, name.c_str(), MPV_FORMAT_INT64, &value_int);
      } else if (value.is_double()) {
        double value_double = value.AsDouble();
        mpv_set_property(mpv_, name.c_str(), MPV_FORMAT_DOUBLE, &value_double);
      }
    } else if (type == "observe_property") {
      std::string name = data.AsString();
      mpv_observe_property(mpv_, 0, name.c_str(), MPV_FORMAT_NODE);
    } else if (type == "get_property_async") {
      std::string name = data.AsString();
      mpv_get_property_async(mpv_, 0, name.c_str(), MPV_FORMAT_NODE);
    }
  }

 private:
  static void* GetProcAddressMPV(void* fn_ctx, const char* name) {
    auto search = GL_CALLBACKS.find(name);
    if (search == GL_CALLBACKS.end()) {
      fprintf(stderr, "FIXME: missed GL function %s\n", name);
      return NULL;
    } else {
      return search->second;
    }
  }

  void PostData(const char* type, const Var& data) {
    pp::VarDictionary dict;
    dict.Set(Var("type"), Var(type));
    dict.Set(Var("data"), data);
    PostMessage(dict);
  }

  void PostPropertyChange(const char* name, const Var& value) {
    pp::VarDictionary dict;
    dict.Set(Var("name"), Var(name));
    dict.Set(Var("value"), value);
    PostData("property_change", dict);
  }

  void HandleMPVEvents(int32_t) {
    for (;;) {
      mpv_event* event = mpv_wait_event(mpv_, 0);
      // printf("@@@ EVENT %d\n", event->event_id);
      if (event->event_id == MPV_EVENT_NONE) break;
      if (event->event_id == MPV_EVENT_PROPERTY_CHANGE ||
        event->event_id == MPV_EVENT_GET_PROPERTY_REPLY) {
        HandleMPVPropertyChange(static_cast<mpv_event_property*>(event->data));
      }
    }
  }

  void HandleMPVPropertyChange(mpv_event_property* prop) {
    // We subscribe only on MPV_FORMAT_NODE format because that way we
    // don't need to know type of properties.
    if (prop->format != MPV_FORMAT_NODE)
      return;
    mpv_node* node = static_cast<mpv_node*>(prop->data);
    if (node->format == MPV_FORMAT_NONE) {
      PostPropertyChange(prop->name, Var::Null());
    } else if (node->format == MPV_FORMAT_STRING) {
      PostPropertyChange(prop->name, Var(node->u.string));
    } else if (node->format == MPV_FORMAT_FLAG) {
      PostPropertyChange(prop->name, Var(static_cast<bool>(node->u.flag)));
    } else if (node->format == MPV_FORMAT_INT64) {
      PostPropertyChange(prop->name, Var(static_cast<int32_t>(node->u.int64)));
    } else if (node->format == MPV_FORMAT_DOUBLE) {
      PostPropertyChange(prop->name, Var(node->u.double_));
    }
  }

  static void HandleMPVWakeup(void* ctx) {
    MPVInstance* b = static_cast<MPVInstance*>(ctx);
    pp::Module::Get()->core()->CallOnMainThread(
        0, b->callback_factory_.NewCallback(&MPVInstance::HandleMPVEvents));
  }

  static void HandleMPVUpdate(void* ctx) {
    // printf("@@@ UPDATE\n");
    MPVInstance* b = static_cast<MPVInstance*>(ctx);
    pp::Module::Get()->core()->CallOnMainThread(
        0, b->callback_factory_.NewCallback(&MPVInstance::OnGetFrame));
  }

  bool InitGL() {
    if (!glInitializePPAPI(pp::Module::Get()->get_browser_interface()))
      DIE("unable to initialize GL PPAPI");

    const int32_t attrib_list[] = {
      PP_GRAPHICS3DATTRIB_ALPHA_SIZE, 8,
      PP_GRAPHICS3DATTRIB_DEPTH_SIZE, 24,
      PP_GRAPHICS3DATTRIB_NONE
    };

    context_ = pp::Graphics3D(this, attrib_list);
    if (!BindGraphics(context_))
      DIE("unable to bind 3d context");

    return true;
  }

  bool InitMPV() {
    setlocale(LC_NUMERIC, "C");
    mpv_ = mpv_create();
    if (!mpv_)
      DIE("context init failed");

    char* terminal = getenv("MPVJS_TERMINAL");
    if (terminal && strlen(terminal))
      mpv_set_option_string(mpv_, "terminal", "yes");
    char* verbose = getenv("MPVJS_VERBOSE");
    if (verbose && strlen(verbose))
      mpv_set_option_string(mpv_, "msg-level", "all=v");

    // Can't be set after initialize in mpv 0.18.
    mpv_set_option_string(mpv_, "input-default-bindings", "yes");
    mpv_set_option_string(mpv_, "pause", "yes");

    if (mpv_initialize(mpv_) < 0)
      DIE("mpv init failed");

    glSetCurrentContextPPAPI(context_.pp_resource());

#if MPV_CLIENT_API_VERSION < MPV_MAKE_VERSION(2, 0)
    mpv_opengl_init_params gl_init_params{GetProcAddressMPV, nullptr, nullptr};
#else
    mpv_opengl_init_params gl_init_params{GetProcAddressMPV, nullptr};
#endif
    mpv_render_param params[] = {
        {MPV_RENDER_PARAM_API_TYPE, const_cast<char *>(MPV_RENDER_API_TYPE_OPENGL)},
        {MPV_RENDER_PARAM_OPENGL_INIT_PARAMS, &gl_init_params},
        {MPV_RENDER_PARAM_INVALID, nullptr}
    };

    if (mpv_render_context_create(&mpv_gl_, mpv_, params) < 0)
      DIE("failed to initialize mpv GL context");

    // Some convenient defaults. Can be always changed on ready event.
    mpv_set_option_string(mpv_, "stop-playback-on-init-failure", "no");
    mpv_set_option_string(mpv_, "audio-file-auto", "no");
    mpv_set_option_string(mpv_, "sub-auto", "no");
    mpv_set_option_string(mpv_, "volume-max", "100");
    mpv_set_option_string(mpv_, "keep-open", "yes");
    mpv_set_option_string(mpv_, "osd-bar", "no");

    return true;
  }

  void LoadMPV() {
    mpv_set_wakeup_callback(mpv_, HandleMPVWakeup, this);
    mpv_render_context_set_update_callback(mpv_gl_, HandleMPVUpdate, this);
    PostData("ready", Var::Null());
  }

  void OnGetFrame(int32_t) {
    // Always called on main thread so don't need locks.
    if (is_painting_) {
      needs_paint_ = true;
    } else {
      is_painting_ = true;
      needs_paint_ = false;
      Render();
    }
  }

  void Render() {
    // XXX(Kagami): Race condition if another plugin sets different
    // context in between calls?
    glSetCurrentContextPPAPI(context_.pp_resource());

    mpv_opengl_fbo mpfbo{static_cast<int>(0), width_, height_, 0};
    int flip_y{1};
    mpv_render_param params[] = {
        {MPV_RENDER_PARAM_OPENGL_FBO, &mpfbo},
        {MPV_RENDER_PARAM_FLIP_Y, &flip_y},
        {MPV_RENDER_PARAM_INVALID, nullptr}
    };

    mpv_render_context_render(mpv_gl_, params);
    context_.SwapBuffers(
        callback_factory_.NewCallback(&MPVInstance::PaintFinished));
  }

  void PaintFinished(int32_t) {
    is_painting_ = false;
    if (needs_paint_)
      OnGetFrame(0);
  }

  pp::CompletionCallbackFactory<MPVInstance> callback_factory_;
  pp::Graphics3D context_;
  mpv_handle* mpv_;
  mpv_render_context* mpv_gl_;
  int32_t width_;
  int32_t height_;
  bool gl_ready_;
  bool is_painting_;
  bool needs_paint_;
};

class MPVModule : public pp::Module {
 public:
  MPVModule() : pp::Module() {}
  virtual ~MPVModule() {}

  virtual pp::Instance* CreateInstance(PP_Instance instance) {
    return new MPVInstance(instance);
  }
};

namespace pp {
Module* CreateModule() {
  return new MPVModule();
}
}  // namespace pp
