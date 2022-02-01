import { context } from "./main.js";
import { Graph, Useful } from "./gameUtils.js";

export class Sprite
{
    private x: number = 0;
    private y: number = 0;
    private z: number = 0;
    private image: Graph = null;
    private u: number = 0;
    private v: number = 0;
    private width: number = 0;
    private height: number = 0;
    private isReverse: boolean = false;
    private isProtect: boolean = false;
    private link: Sprite = null;
    private blendPal: number = 1.0;
    private belong: any = null;
    
    private updateMethod: (hSpr: Sprite) => void = function(hSp){};
    private drawingMethod: (hSpr: Sprite, hX: number, hY: number) => void = Sprite.DrawingProcess.rough;
    private destructorMethod: (hSp: Sprite) => void = function(hSp){};

    
    private static sprites: Sprite[];
    private static roughScale: number = 3;


    static init()
    {
        this.sprites = [];
    }

    public constructor();
    public constructor(image: Graph, u: number, v: number, w: number, h: number);


    public constructor(image?: Graph, u?: number, v?: number, w?: number, h?: number)
    {
        if (image !== undefined)
        {
            this.image = image;
        }
        if (u != undefined && v != undefined && w != undefined && h != undefined)
        {
            this.u = u;
            this.v = v;
            this.width = w;
            this.height = h;
        }
        Sprite.sprites.push(this);
    }


    public setReverse(rev: boolean): void
    {
        this.isReverse = rev;
    }

    
    public setImage(): void;
    public setImage(image: Graph): void;
    public setImage(image: Graph, u: number, v: number): void;
    public setImage(image: Graph, u: number, v: number, w: number, h: number): void;

    public setImage(image?: Graph, u?: number, v?: number, w?: number, h?: number): void
    {
        if (image!=undefined) this.image = image;

        if (u!==undefined) this.u = u;
        if (v!==undefined) this.v = v;
        if (w!==undefined) this.width = w;
        if (h!==undefined) this.height = h;
    }


    public setXY(x: number, y: number)
    {
        this.x = x;
        this.y = y;
    }


    public setZ(z: number)
    {
        this.z = z;
    }


    public getScreenXY(sp): [number, number]
    {
        let dx, dy;
        [dx, dy] = this.getLinkDifferenceXY();

        let x = this.x + dx;
        let y = this.y + dy;
        return [x, y];
    }


    public setBelong(instance): void
    {
        this.belong = instance;
    }

    public getBelong() : any
    {
        return this.belong;
    }

    public setLink(link): void
    {
        this.link = link
    }

    public getLinkDifferenceXY(): [number, number]
    {
        if(this.link != null)
        {
            let linkSpr: Sprite = this.link;
            let dx, dy;
            [dx, dy] = linkSpr.getLinkDifferenceXY();
            return [linkSpr.x + dx, linkSpr.y + dy]
        }else
        {
            return [0, 0]
        }
    }

    public SetBlendPal(pal256: number)
    {
        this.blendPal=pal256/255;
    }

    public setUpdateMethod(func: (hSpr: Sprite) => void): void
    {
        this.updateMethod = func;
    }

    public setDrawingMethod(func: (hSpr: Sprite, hX: number, hY: number) => void): void
    {
        this.drawingMethod = func;
    }

    public setdestructorMethod(func: (hSpr: Sprite) => void): void
    {
        this.destructorMethod = func;
    }

    // 消去しないようにする
    public setProtect(protect: boolean): void
    {
        this.isProtect = protect;
    }

    public static delete(spr: Sprite): void;
    public static delete(spr: Sprite, isProtect: boolean): void;

    public static delete(spr: Sprite, isProtect: boolean = false): void
    {
        if (isProtect) return;
        spr.destructorMethod(spr);
        Useful.remove(Sprite.sprites, this);
    }

    public static deleteAll(isProtect: boolean=false)
    {
        let target: Sprite[];
        for(let i=this.sprites.length - 1; i>=0; i--)
        {
            if (isProtect && this.sprites[i].isProtect) continue; 
            this.delete(this.sprites[i], isProtect);
        }
}



    static allUpdate(): void
    {
        for(let i=0; i<this.sprites.length; i++)
        {
            this.sprites[i].updateMethod(this.sprites[i]);
        }
    }

    static allDrawing(): void
    {
        
        this.sprites.sort(function(a: Sprite, b: Sprite){return b.z-a.z});

        for (let i=0; i<this.sprites.length; i++)
        {
            let spr: Sprite = this.sprites[i];
            {

                let x, y;
                if(spr.link!=null)
                {
                    let dx, dy;
                    [dx, dy] = spr.getLinkDifferenceXY();
                    x=(spr.x + dx) | 0;
                    y=(spr.y + dy) | 0;
                }
                else
                {
                    x=(spr.x) | 0
                    y=(spr.y) | 0
                }

                x *= this.roughScale;
                y *= this.roughScale;
                context.globalAlpha =spr.blendPal;
                spr.drawingMethod(this.sprites[i], x, y);
            }

        }
    }

    static DrawingProcess = class
    {
        static rough(hSp: Sprite, hX, hY)
        {
            Sprite.DrawingProcess.draw(hSp, hX, hY, Sprite.roughScale);
        }
        static dotByDot(hSp: Sprite, hX, hY)
        {
            Sprite.DrawingProcess.draw(hSp, hX, hY, 1);
        }
        static draw(spr: Sprite, x, y, scale)
        {
            if (spr.image==null) return;

            if (spr.isReverse) 
            {
                spr.image.drawTurnGraph(x, y, spr.u, spr.v, spr.width, spr.height, scale); 
            }
            else 
            {
                spr.image.drawGraph(x, y, spr.u, spr.v, spr.width, spr.height, scale);
            }
        }
    }
}


