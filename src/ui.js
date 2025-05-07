import "@zebra-fed/zeta-web/index.css";
import "@lottiefiles/lottie-player";
import * as animation from "./check.json";

export const loadAnimation = () => {
    const player = document.querySelector("lottie-player");
    player.addEventListener("rendered", (e) => {
        player.load(animation);
    });
};

(window).loadAnimation = loadAnimation;
