import { context } from "./main.js";


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


