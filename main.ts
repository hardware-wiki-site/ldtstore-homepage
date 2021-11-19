declare const PAGE_TYPE: "home" | "tool";

const body = document.documentElement;
const background = document.getElementById("background")!;
const content = document.getElementById("content")!;
const offset = document.getElementById("offset")!;
const major = document.getElementById("major")!;
const side = document.getElementById("side")!;

const OFFSET_LIT = 13;
// TODO 这里的长度和major中的left一样 添加新的pagetype记得修改这里
const OFFSET = {
    "home": 33,
    "tool": 38,
}[PAGE_TYPE];

const r = (key: string) => {
    window.open("https://ldtstore.com.cn/r/" + key, "_blank");
};

const r2 = (key: string) => {
    window.open("https://ldtstore.com.cn/r2/" + key, "_blank");
};

const copy = (text: string) => {
    navigator.clipboard.writeText(text);
};

let layoutMode = "pc";

const SideState: {
    distance: number,
    on: boolean,
    center: boolean,
    id: string | null,
    changing: boolean,
} = {
    distance: 300,
    on: false,
    center: false,
    id: null,
    changing: false,
};

// 左滑返回

let touchX = 0;
let touchY = 0;

window.ontouchstart = (e: TouchEvent) => {
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
};

window.ontouchmove = (e: TouchEvent) => {
    const y = e.changedTouches[0].clientY;
    if (Math.abs(touchY - y) > 10) {
        sideClose();
    }
};

window.ontouchend = (e: TouchEvent) => {
    const x = e.changedTouches[0].clientX;
    if (touchX - x < -40) {
        sideClose();
    }
};

content.onclick = (e) => {
    // 背景点击事件绑定位置变了，这里用来阻止冒泡
    if (e.composedPath()[0] === content) {
        sideClose();
    }
};

const sideClose = () => {
    SideState.id = null;
    sideMove(false);
    sideChange(null);
};

const sideMove = (enable: boolean) => {
    if (SideState.on !== enable) {
        SideState.on = enable;

        if (enable) {
            offset.style.left = -SideState.distance + "px";
            side.style.left = `calc(50% + ${layoutMode === "pc" ? OFFSET : OFFSET_LIT}em - ${SideState.distance}px)`;
        } else {
            offset.style.left = "0";
            side.style.left = `calc(50% + ${layoutMode === "pc" ? OFFSET : OFFSET_LIT}em)`;
            SideState.id = null;
        }
    }
};

const sideChange = (id: string | null) => {
    const enable = id !== null;
    if (enable) {
        while (side.firstChild) {
            side.removeChild(side.lastChild!);
        }
        side.appendChild((document.getElementById("side-" + id) as HTMLTemplateElement).content.cloneNode(true));
    }
    side.style.opacity = enable ? "1" : "0";

    // 防止横向的在侧边栏展开的情况下还能被点到
    major.style.visibility = "visible";
    content.style.pointerEvents = "auto";
    major.style.opacity = (SideState.center && enable) ? "0" : "1";
};

const sideClick = (id: string | null) => {
    if (!SideState.on) {
        SideState.id = id;
        sideMove(true);
        sideChange(SideState.id);
    } else {
        if (SideState.id === id) {
            SideState.id = null;
            sideMove(false);
            sideChange(null);
        } else {
            SideState.id = id;
            sideChange(null);
        }
    }
};

side.addEventListener("transitionend", (e) => {
    if (e.propertyName === "opacity") {
        if (major.style.opacity === "0") {
            // 防止横向的在侧边栏展开的情况下还能被点到
            major.style.visibility = "hidden";
            content.style.pointerEvents = "none";
        }
    }
    if (e.propertyName === "left") {
        recalculate();
    } else if (e.propertyName === "opacity") {
        if (side.style.opacity === "0" && SideState.id !== null) {
            sideChange(SideState.id);
        }
        if (SideState.changing) {
            SideState.changing = false;
        }
    }
});

const recalculate = () => {
    // 判定平台，和css对应
    if (body.clientWidth > 800) {
        layoutMode = "pc";
    } else if (body.clientWidth > 500) {
        layoutMode = "pad";
    } else {
        layoutMode = "phone";
    }

    // 设置遮罩大小为窗口大小
    content.style.width = body.clientWidth + "px";
    content.style.height = body.clientHeight + "px";

    // 计算相对大小
    let scaleW: number;
    let scaleH: number;
    if (layoutMode === "pc") {
        scaleW = body.clientWidth / 1056;
        scaleH = body.clientHeight / 900;
    } else {
        scaleH = body.clientHeight / 880;
        if (layoutMode === "pad") {
            scaleW = body.clientWidth / 600;
        } else {
            scaleW = body.clientWidth / 450;
        }
    }
    major.style.fontSize = side.style.fontSize = Math.min(scaleH, scaleW) + "em";

    // 垂直方向：计算major的间距
    let delta = body.clientHeight - major.clientHeight;
    delta = delta < 120 ? 120 : delta;
    delta -= 4;
    side.style.height = `calc(${body.clientHeight - delta}px - 6em)`;
    major.style.marginTop = side.style.marginTop = major.style.marginBottom = side.style.marginBottom = delta / 2 + "px";

    // 水平方向：计算side移动的距离
    delta = body.clientWidth - major.clientWidth - side.clientWidth;
    SideState.center = false;
    if (delta > 0) {
        SideState.distance = major.offsetLeft - delta / 2;
    } else {
        const delta2 = body.clientWidth - major.clientWidth;
        // TODO 添加新的pagetype记得修改这里
        if (PAGE_TYPE === "tool" && delta2 < 1) {
            SideState.center = true;
            delta = body.clientWidth - side.clientWidth;
            SideState.distance = side.offsetLeft - delta / 2;
        } else {
            if (layoutMode === "phone") {
                delta = body.clientWidth - side.clientWidth;
                SideState.center = true;
                SideState.distance = major.clientWidth + major.offsetLeft - delta / 2;
            } else {
                SideState.distance = -delta + major.offsetLeft;
            }
        }
    }
};

window.onresize = () => {
    recalculate();

    if (SideState.on) {
        sideClose();
    } else {
        side.style.left = `calc(50% + ${layoutMode === "pc" ? OFFSET : OFFSET_LIT}em)`;
    }
};

interface Window {
    r?: typeof r;
    r2?: typeof r2;
    copy?: typeof copy;
    sideClick?: typeof sideClick;
}

window.r = r;
window.r2 = r2;
window.copy = copy;
window.sideClick = sideClick;

background.style.backgroundImage = `url('/assert/image/bg/${new Date().getDay()}.webp')`;

recalculate();