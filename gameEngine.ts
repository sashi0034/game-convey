import { Sprite } from "./sprite.js";
import {
    Graphics,
    Graph,
    Sound,
    Input,
    Useful,
} from "./gameUtils.js";


// 基底オブジェクト
export class Actor
{
    protected spr: Sprite;
    protected time: number = 0;
    
    public get getSpr(): Sprite {return this.spr;}
    public get getTime(): number {return this.time;}

    constructor()
    {
        this.spr = new Sprite();
        this.spr.setUpdateMethod(Actor.callUpdate)
        this.spr.setdestructorMethod(Actor.calldestructor)
        this.spr.setBelong(this);

    }

    private static callUpdate(hSpr: Sprite): void
    {
        let self: Actor = hSpr.getBelong();
        self.update();
    }

    protected update(): void
    {
        this.time++;
    }

    private static calldestructor(hSpr: Sprite): void
    {
        let self: Actor = hSpr.getBelong();
        self.destructor();
    }

    protected destructor(): void {}
}

export abstract class SelfDrawingActor extends Actor
{
    constructor()
    {
        super();
        this.spr.setDrawingMethod(SelfDrawingActor.callDrawing);
    }

    private static callDrawing(hSpr: Sprite, hX: number, hY: number): void
    {
        let self: SelfDrawingActor = hSpr.getBelong();
        self.drawing(hX, hY);
    }

    protected abstract drawing(hX: number, hY: number): void;
}


export class CollideActor extends Actor
{
    private static colliders: CollideActor[] = [];
    public static get getColliders() {return CollideActor.colliders;}

    protected x: number = 0;
    protected y: number = 0;
    protected mask: number;
    protected shape: Collider.Shape;

    public get getX() {return this.x;}
    public get getY() {return this.y;}
    public get getMask() {return this.mask;}
    public get getShape() {return this.shape;}

    constructor(shape: Collider.Shape, mask: number)
    {
        super();
        this.shape = shape;
        this.mask = mask;
        CollideActor.colliders.push(this);
    }

    protected override update(): void
    {
        this.spr.setXY(this.x, this.y);
        super.update();
    };
    protected override destructor(): void 
    {
        Useful.remove(CollideActor.colliders, this);
        super.destructor();
    }
}



export namespace Collider
{
    export const EType = {
        Rectangle: 0,
    } as const
    type EType = typeof EType[keyof typeof EType];

    export interface Shape
    {
        type: number;
    }

    export class Rectangle implements Shape
    {
        public type: number = 0;
        public colliderX: number;
        public colliderY: number;
        public colliderWidth: number;
        public colliderHeight: number;
        public constructor(colliderX, colliderY, colliderWidth, colliderHeight)
        {
            this.colliderX = colliderX;
            this.colliderY = colliderY;
            this.colliderWidth = colliderWidth;
            this.colliderHeight = colliderHeight;
        }
    }
}

export namespace Hit
{
    export function checkRectReck(x1: number, y1: number, width1: number, height1: number,
        x2: number, y2: number, width2: number, height2: number): boolean
    {
        return (Math.abs(x2 + width2 / 2.0 - (x1 + width1 / 2.0)) < (width1 + width2) / 2.0 
        && Math.abs(y2 + height2 / 2.0 - (y1 + height1 / 2.0)) < (height1 + height2) / 2.0);
    }

    // 正方形に接触したオブジェクトを返す
    function getHitRect(x: number, y: number, 
        width: number, height: number, mask: number): CollideActor
    {
        return getHitRectFromIndex(x, y, width, height, mask, 0);        
    }


    function getHitRectFromIndex(x: number, y: number, 
        width: number, height: number, mask: number, firstIndex: number): CollideActor
    {
        let ret: CollideActor = null;

        let cols: CollideActor[] = CollideActor.getColliders;
        for (let i=firstIndex; i<cols.length; i++)
        {
            let col: CollideActor = cols[i];
            if ((col.getMask & mask) != 0)
            {
                let shape = col.getShape;

                switch (shape.type)
                {
                    case Collider.EType.Rectangle:
                    {// 長方形同士の当たり判定
                        let rect: Collider.Rectangle = shape as Collider.Rectangle;
                        if (checkRectReck(col.getX + rect.colliderX, col.getY + rect.colliderY, rect.colliderWidth, rect.colliderHeight,
                            x, y, width, height))
                        {
                            ret = col;        
                        }
                        break;
                    }
                    default:
                        break;
                }
                if (ret != null) break;
            }
        }
        return ret;

    }

    export function getHitRectAll(x: number, y: number, 
        width: number, height: number, mask: number): CollideActor[]
    {
        let ret: CollideActor[] = [];
        for (let i=0; i<CollideActor.getColliders.length; i++)
        {
            let col = getHitRectFromIndex(x, y, width, height, mask, i);
            if (col==null) break;
            ret.push(col);
        }
        return ret;
    }
}






