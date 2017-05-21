{
  "targets": [
    {
      "target_name": "mpvjs",
      "win_delay_load_hook": "false",
      "sources": ["index.cc"],
      "libraries": ["-lppapi", "-lppapi_cpp", "-lppapi_gles2"],
      "conditions": [
        ["OS=='win'", {
          "include_dirs": ["C:/nacl_sdk/pepper_49/include", "C:/mpv-dev/include"],
          "libraries": ["-llibmpv.dll.a"],
          "conditions": [
            ["target_arch=='ia32'", {
              "library_dirs": [
                "C:/nacl_sdk/pepper_49/lib/win_x86_32_host/Release",
                "C:/mpv-dev/32",
              ],
            }, "target_arch=='x64'", {
              "library_dirs": [
                "C:/nacl_sdk/pepper_49/lib/win_x86_64_host/Release",
                "C:/mpv-dev/64",
              ],
            }],
          ],
        }, {
          "include_dirs": ["$(NACL_SDK_ROOT)/include"],
          "libraries": ["-lmpv"],
          "conditions": [
            ["OS=='linux'", {
              "defines": ["_GLIBCXX_USE_CXX11_ABI=0"],
              "library_dirs": ["$(NACL_SDK_ROOT)/lib/linux_host/Release"],
              "ldflags": ["-static-libstdc++"],
            }, "OS=='mac'", {
              "xcode_settings": {"MACOSX_DEPLOYMENT_TARGET": "10.9"},
              "library_dirs": ["$(NACL_SDK_ROOT)/lib/mac_host/Release"],
            }],
          ],
        }],
      ],
    },
  ],
}
