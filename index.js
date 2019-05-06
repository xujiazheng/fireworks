/**
 * 传入两个坐标，上抛顶点坐标和起始坐标
 * 返回一个操作。
 * getY方法传入x轴值，返回y轴值。
 */
const getParabolaer = (topPos, startPos) => {
    const xMidd = topPos.x - startPos.x;
    const yMidd = topPos.y - startPos.y;
    const oriZeroPos = {
        x: topPos.x,
        y: startPos.y,
    };
    const simStartPos = {
        x: -xMidd,
        y: 0,
    };
    const simTopPos = {
        x: 0,
        y: -yMidd,
    };
    const k = (simStartPos.y - simTopPos.y) / (simStartPos.x * simStartPos.x);
    const calculateSimY = (x) => {
        return k * x * x + simTopPos.y;
    };

    const transformPos = (simPos) => {
        return {
            x: oriZeroPos.x + simPos.x,
            y: oriZeroPos.y - simPos.y,
        };
    }

    const getReallyYByX = (oriX) => {
        const simX = oriX - oriZeroPos.x;
        const simY = calculateSimY(simX);
        return transformPos({
            x: simX,
            y: simY,
        }).y;
    };
    return {
        getY: getReallyYByX,
    };
};

/**
 * 传入顶端坐标和额外的数据options
 * options: 
 *  stepX: x轴的移动步长
 *  g: 重力加速度
 */
const getDroper = (topPos, {
    stepX,
    g = 0.5,
}) => {
    const {
        x: startX,
        y: startY,
    } = topPos;

    return {
        getX(t) {
            return startX + t * stepX;
        },
        getY(t) {
            return startY + g * t * t / 2;
        },
    };
};

// 获取随机数
const random = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const setStyle = (dom, styles) => {
    for (let key in styles) {
        dom.style[key] = styles[key];
    }
};

class MemAntDOM {
    _randomBg() {
        return `rgba(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)}, ${random(0.6, 1)})`;
    }
    _randomTopPos() {
        const {
            startPos,
            config,
        } = this;
        const {
            up_rangeX,
            up_rangeY,
        } = config;
        const randX = random(up_rangeX[0], up_rangeX[1]);
        const randY = random(up_rangeY[0], up_rangeY[1]);
        return {
            x: startPos.x + randX,
            y: startPos.y + randY,
        };
    }
    _getDroper() {
        const {
            topPos,
            offsetX,
            config,
        } = this;
        return getDroper(topPos, {
            stepX: (offsetX > 0 ? 1 : -1) * Math.sqrt(Math.abs(offsetX)) / 4,
            g: config.drop_g,
        });
        
    }
    _getParabolaer() {
        const {
            topPos,
            startPos,
        } = this;
        return getParabolaer(topPos, startPos);
    }
    _generate() {
        const {
            startPos,
            config,
        } = this;
        const {
            width,
            height,
        } = config;
        const target = document.createElement('div');
        setStyle(target, {
            position: 'fixed',
            zIndex: '999999',
            left: `${startPos.x}px`,
            top: `${startPos.y}px`,
            width: `${width}px`,
            height: `${height}px`,
            borderRadius: '50%',
            background: this._randomBg(),
        });
        document.body.appendChild(target);
        return target;
    }
    // 创建步骤1：上抛物线
    _createStage1() {
        const {
            startPos,
            offsetX,
            parabolaer,
            target,
        } = this;
        return {
            done: false,
            total: random(10, 20),
            next(count) {
                if (this.done) {
                    return;
                }
                const currentX = startPos.x + (offsetX / this.total * count);
                const currentY = parabolaer.getY(currentX);
                setStyle(target, {
                    top:  `${currentY}px`,
                    left: `${currentX}px`,
                });
                
                if (count === this.total) {
                    this.done = true;
                }
            },
        }
    }
    // 创建步骤2: 自由落体
    _createStage2() {
        const {
            droper,
            target,
        } = this;
        return {
            done: false,
            next(count) {
                if (this.done) {
                    return;
                }
                let currentY = droper.getY(count);
                let currentX = droper.getX(count);
                setStyle(target, {
                    top:  `${currentY}px`,
                    left: `${currentX}px`,
                });
                if (currentY > window.innerHeight) {
                    this.done = true;
                }
            },
        };
    }
    constructor({config, startPos}) {
        // 初始化数据
        this.config = config;
        this.startPos = startPos;
        this.done = false;
        // 计算必要数据
        this.topPos = this._randomTopPos();
        this.offsetX = this.topPos.x - this.startPos.x;
        // 初始化所需场景对象
        this.droper = this._getDroper();
        this.parabolaer = this._getParabolaer();
        this.target = this._generate();
        this.stage1 = this._createStage1();
        this.stage2 = this._createStage2();
    }
    distory() {
        if (this.target && this.target.parentNode) {
            this.target.parentNode.removeChild(this.target);
        }
    }
    next(count) {
        if (this.done) {
            return;
        }
        if (!this.stage1.done) {
            this.stage1.next(count);
        } else if (!this.stage2.done) {
            this.stage2.next(count - this.stage1.total);
        } else {
            this.done = true;
        }
    }
}

const MemAnt = window.MemAnt = {
    _config: {
        // 上抛顶端x轴偏移区间
        up_rangeX: [-60, 60],
        // 上抛顶端y轴偏移区间，因为网上x轴减少，所以是负数
        up_rangeY: [-70, -10],
        // 下落小球x轴偏移步长区间
        drop_rangeX: [0, 2],
        // 下落小球重力加速度（控制速度）每个小球采用同样的重力加速度
        drop_g: 0.8,
        // 小球宽度和高度
        width: 4,
        height: 4,
        // 随机小球个数
        nums: random(10, 18),
    },
    setConf(options) {
        Object.assign(this._config, options);
    },
    get(startPos) {
        const ants = new Array(this._config.nums).fill('-').map(() => new MemAntDOM({
            config: this._config,
            startPos,
        }));
        return {
            next: this.setNext(ants),
            isDone: this.setDone(ants),
            distory: this.distory(ants),
        };
    },
    distory(ants) {
        return () => {
            ants.forEach((ant) => {
                ant.distory();
            });
        };
    },
    setNext(ants) {
        return (count) => {
            ants.forEach((ant) => {
                ant.next(count);
            });
        };
    },
    setDone(ants) {
        return () => !ants.filter((ant) => !ant.done).length
    },
};

const MemAntInterval = window.MemAntInterval = ({startPos, interval, config}) => {
    if (config) {
        MemAnt.setConf(config);
    }
    const handle = MemAnt.get(startPos);
    let num = 0;
    let timer = setInterval(() => {
        console.log(num)
        handle.next(num++);
        if (handle.isDone()) {
            handle.distory();
            clearInterval(timer);
        }
    }, interval);
};
