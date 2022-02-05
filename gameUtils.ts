import { context, canvas } from "./main.js";
import { Sprite } from "./sprite.js";


// 画像
export class Graph
{
    public mat: HTMLImageElement;

    constructor()
    {
        this.mat = new Image();
    }

    // 描画
    public drawGraph(x: number, y: number, u: number, v: number, w: number, h: number, scale): void 
    {
        context.drawImage(this.mat, u, v, w, h, x, y, w * scale, h * scale);
    }
    public drawTurnGraph(x: number, y: number, u: number, v: number, w: number, h: number, scale): void 
    {
        context.save();
        context.translate(x + w * scale, y);
        context.scale(-1, 1);
        context.drawImage(this.mat, u, v, w, h, 0, 0, w * scale, h * scale);
        context.restore();
    }
}


// グラフィック読み込み
export class Graphics
{

  // 画像読み込み
    static loadGraph(path): Graph
    {
        let graph: Graph = new Graph;
        
        graph.mat.src = path;

        return graph;
    }
    

    static drawBox(x1: number, y1: number, x2: number, y2: number, color: string, fillFlag: boolean): void 
    {
        x2--; y2--;
        if (fillFlag) {
            context.fillStyle = color;
            context.beginPath();
            context.moveTo(x1, y1);
            context.lineTo(x1, y2);
            context.lineTo(x2, y2);
            context.lineTo(x2, y1);
            context.closePath();
            context.fill();
        }
        else {
            context.strokeStyle = color;
            context.beginPath();
            context.moveTo(x1, y1);
            context.lineTo(x1, y2);
            context.lineTo(x2, y2);
            context.lineTo(x2, y1);
            context.closePath();
            context.stroke();
        }
    }

    static drawQuadrangle(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number, color: string, fillFlag: boolean) 
    {
        x2--; y2--;
        if (fillFlag) 
        {
            context.fillStyle = color;
            context.beginPath();
            context.moveTo(x1, y1);
            context.lineTo(x2, y2);
            context.lineTo(x3, y3);
            context.lineTo(x4, y4);
            context.closePath();
            context.fill();
        }
        else 
        {
            context.strokeStyle = color;
            context.beginPath();
            context.moveTo(x1, y1);
            context.lineTo(x2, y2);
            context.lineTo(x3, y3);
            context.lineTo(x4, y4);
            context.closePath();
            context.stroke();
        }
    }

}


// 音声
export class Sound
{
    static playSoundFile(path, vol=0.5, loop: boolean=false): HTMLAudioElement
    {
        let music: HTMLAudioElement = new Audio(path);
        music.volume=vol;
        music.loop = false;
        music.play();

        if (loop) 
        {
            music.addEventListener("ended", function () 
            {
                music.currentTime = 0;
                music.play();
            }
            , false);
        }

        return music;
    }
}



// 便利なメソッド
export class Useful
{
    static drawStringInit()
    {
        context.font = "48px 'Impact'";
        context.lineWidth = "8";
        context.lineJoin = "miter";
        context.miterLimit = "5"
    }

    static drawStringEdged(x, y, text, inColor="#fff")
    {
        y+=48;
        context.strokeText(text, x, y);
        context.fillStyle = inColor
        context.fillText(text, x, y);

    }

    static rand(n)
    {
        return (Math.random()*n) | 0;
    }
    static rand2(min, max)
    {
        return min+this.rand(max-min);
    }
    static between(n, min, max)
    {
        return (min<=n && n <= max);
    }
    static isString(obj) {
        return typeof (obj) == "string" || obj instanceof String;
    };

    static toInt(n: number): number
    {
        return n|0;
    }

    static xyToRough(arr: [number, number]): [number, number]
    {
        for (let i=0; i<arr.length; i++)
        {
            arr[i] *= 3
        }
        return arr;
    }
    static boxToRough(arr: [number, number, number, number]): [number, number, number, number]
    {
        for (let i=0; i<arr.length; i++)
        {
            arr[i] *= 3;
        }
        return arr;
    }

    static shuffleArray(arr: Array<any>)
    {
        for (let i=0; i<arr.length*2; i++)
        {
            let a = this.rand(arr.length);
            let b = this.rand(arr.length);
            [arr[a], arr[b]] = [arr[b], arr[a]]
        }
    }

    static remove(arr: Array<any>, target: any)
    {
        let i=arr.indexOf(target);
        if (i>-1) arr.splice(i, 1);
    }

    static mod(n: number, m: number)
    {
        let ret = n % m;
        return ret<0 ? ret+m : ret;
    }
}





// 入力
export class Input
{
    private static sole = null;

    private mouse: Mouse
    public get getMouse(): Mouse {return this.mouse};
    public static readonly Click = { NONE: -1,  RIGHT: 0 } as const
    
    private isKeyDown: {[key: string]: boolean} = {}
    public get getKeyDown(): {[key: string]: boolean} {return this.isKeyDown}; 
    private keyUse: string[] = []

    public constructor(keyUse: string[])
    {
        if (Input.sole != null) console.error("Input instance has already exist.");
        Input.sole = this;

        this.mouse = new Mouse;
        this.keyUse = keyUse;

        document.onmousemove = Input.onMouseMove;    // マウス移動ハンドラ
        document.onmouseup = Input.onMouseUp;        // マウスアップハンドラ
        document.onmousedown = Input.onMouseDown;    // マウスダウンハンドラ

        // キーボード入力
        Input.onKeyInit();
        document.addEventListener("keypress", Input.onKeyDown);
        document.addEventListener("keyup", Input.onKeyUp);
    }

    public end()
    {
        Input.sole = null;
    }

    private static onMouseMove( e ) 
    {
        Input.sole.mouse.x = e.clientX;
        Input.sole.mouse.y = e.clientY;
        let pos = Input.clientToCanvas( canvas, Input.sole.mouse.x, Input.sole.mouse.y );
        Input.sole.mouse.x = pos.x + window.pageXOffset
        Input.sole.mouse.y = pos.y + window.pageYOffset
        
    }

    private static clientToCanvas(canvas, clientX, clientY) 
    {
        let cx = clientX - canvas.offsetLeft + document.body.scrollLeft;
        let cy = clientY - canvas.offsetTop + document.body.scrollTop;
        
        let ret = 
        {
            x: cx,
            y: cy
        };
        return ret;
    }

    private static onMouseKey( e ) 
    {
        Input.sole.mouse.state = Input.Click.NONE;
    }
    
    private static onMouseDown( e ) 
    {
        Input.sole.mouse.state = e.button;
    }
    
    private static onMouseUp( e ) 
    {
        Input.sole.mouse.state = Input.Click.NONE;
    }

    
    private static onKeyInit() 
    {
        for (let i=0; i<Input.sole.keyUse.length; i++)
        {
            Input.sole.isKeyDown[Input.sole.keyUse[i]] = false;
        }
    }

    private static onKeyDown(e) 
    {    
        for (let i=0; i<Input.sole.keyUse.length; i++)
        {
            let c = Input.sole.keyUse[i];
            if (e.key === c || e.key === c.toUpperCase())
            {
                Input.sole.isKeyDown[c] = true;
            }
        }
    }

    private static onKeyUp ( e )
    {
        for (let i=0; i<Input.sole.keyUse.length; i++)
        {
            let c = Input.sole.keyUse[i];
            if (e.key === c || e.key === c.toUpperCase())
            {
                Input.sole.isKeyDown[c] = false;
            }
        }
    }
    
}
type Click = typeof Input.Click[keyof typeof Input.Click];


class Mouse
{
    x: number = 0
    y: number = 0
    state: Click = Input.Click.NONE

    constructor()
    {
        
    }

    public get getXY(): [number, number]
    {
        return [this.x, this.y]
    }
}












