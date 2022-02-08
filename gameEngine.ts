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
    protected colbit: number;
    private shape: Collider.Shape;

    public get getX() {return this.x;}
    public get getY() {return this.y;}
    public get getColbit() {return this.colbit;}
    public get getShape() {return this.shape;}
    public setX(value) {this.x = value;}
    public setY(value) {this.y = value;}

    constructor(shape: Collider.Shape, colbit: number)
    {
        super();
        this.shape = shape;
        this.colbit = colbit;
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

    public getHit(): CollideActor
    {
        return Hit.getHitCollideActor(this);
    }
    public getHitWith(actor: CollideActor): boolean
    {
        switch (this.shape.type)
        {
            case Collider.EType.Rectangle:
            {
                let rect: Collider.Rectangle = this.shape as Collider.Rectangle;
                return Hit.getHitRectWith(
                    this.x+rect.colliderX, this.y+rect.colliderY, 
                    rect.colliderWidth, rect.colliderHeight, this.colbit, actor);
            }
        }
        return false;
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
    export function getHitRect(x: number, y: number, 
        width: number, height: number, colbit: number): CollideActor      
    
    export function getHitRect(x: number, y: number, 
        width: number, height: number, colbit: number): CollideActor
    {
        return getHitRectFromIndex(x, y, width, height, colbit, 0)[0];        
    }


    function getHitRectFromIndex(x: number, y: number, 
        width: number, height: number, colbit: number, firstIndex: number): [CollideActor, number]
    {
        let ret: CollideActor = null;
        let retI: number = -1;

        let cols: CollideActor[] = CollideActor.getColliders;
        for (let i=firstIndex; i<cols.length; i++)
        {
            let col: CollideActor = cols[i];
            if ((col.getColbit & colbit) !== 0)
            {
                if (getHitRectWith(x, y, width, height, colbit, col)===true) 
                {
                    ret = col;
                    retI = i
                    break;
                }
            }
        }
        return [ret, retI];
    }

    export function getHitRectWith(x: number, y: number, 
        width: number, height: number, colbit: number, col: CollideActor): boolean
    {
        let shape: Collider.Shape = col.getShape;
        switch (shape.type)
        {
            case Collider.EType.Rectangle:
            {// 長方形同士の当たり判定
                let rect: Collider.Rectangle = shape as Collider.Rectangle;
                if (checkRectReck(col.getX + rect.colliderX, col.getY + rect.colliderY, rect.colliderWidth, rect.colliderHeight,
                    x, y, width, height))
                {
                    return true;
                }
                break;
            }
            default:
                break;
        }
        return false;
    }





    export function getHitRectAll(x: number, y: number, 
        width: number, height: number, colbit: number): CollideActor[]
    {
        let ret: CollideActor[] = [];
        let i: number=0;
        while (true)
        {
            let col
            [col, i] = getHitRectFromIndex(x, y, width, height, colbit, i);
            if (col===null) break;
            ret.push(col);
            i = i + 1;
        }
        return ret;
    }

    export function getHitCollideActor(actor: CollideActor)
    {
        let ret: CollideActor = null;
        
        let i=0;
        while (true)
        {
            let col: CollideActor = null;
            switch (actor.getShape.type)
            {
                case Collider.EType.Rectangle:
                {
                    let rect = actor.getShape as Collider.Rectangle;
                    [col, i] = getHitRectFromIndex(
                        actor.getX + rect.colliderX , actor.getY + rect.colliderY, 
                        rect.colliderWidth, rect.colliderHeight, actor.getColbit, i);
                    break;
                }
            }
            if (col === actor) 
            {
                i = i + 1;
                continue;
            }
            ret = col;
            break;
        }
        return ret;
    }
}






