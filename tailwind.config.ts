import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0A0A0A",
        paper: "#FFFFFF",
        smoke: "#F5F5F5",
        ash: "#8A8A8A"
      }
    },
  },
  plugins: [],
};
export default config;
