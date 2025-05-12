import "@zebra-fed/zeta-web/index.css";
import "@lottiefiles/lottie-player";
import * as animation from "./check.json";

window.loadAnimation = () => {
    document.querySelector("lottie-player")
        .addEventListener("rendered", e => e.target.load(animation));
};
