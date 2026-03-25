import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  base: "/",
  build: {
    rollupOptions: {
      input: {
        "11_module_A": resolve(__dirname, "index.html"),
        A1: resolve(__dirname, "11_module_A/A1/index.html"),
        A2: resolve(__dirname, "11_module_A/A2/index.html"),
        A3: resolve(__dirname, "11_module_A/A3/index.html"),
        A4: resolve(__dirname, "11_module_A/A4/index.html"),

        "11_module_B": resolve(__dirname, "index.html"),
        B1: resolve(__dirname, "11_module_B/B1/index.html"),
        B2: resolve(__dirname, "11_module_B/B2/index.html"),
        B3: resolve(__dirname, "11_module_B/B3/index.html"),
        B4: resolve(__dirname, "11_module_B/B4/index.html"),

        "11_module_C": resolve(__dirname, "index.html"),
        C1: resolve(__dirname, "11_module_C/C1/index.html"),
        C2: resolve(__dirname, "11_module_C/C2/index.html"),
        C3: resolve(__dirname, "11_module_C/C3/index.html"),
        C4: resolve(__dirname, "11_module_C/C4/index.html"),
      },
    },
  },
});
