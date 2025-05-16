
let canvas = document.getElementById("canvas")

window.onresize = () => {
    if (window.innerWidth <= 600) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}