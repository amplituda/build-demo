# [VCL](https://github.com/vcl/doc) build-demo

This module contains some Gulp tasks to build and serve demos of VCL modules.
Building a demo means to:

- Build the CSS from the specified `devDependencies` in the module and write
  them to the `build` folder.
- Take the demo files from the demo folder, wrap them with the `index.html`
  template from this module and write them to the `build` folder.
  The rendered template contains the includes to the generated CSS.
