
import { Sprite } from "./sprite.js";
import {
    Graphics,
    Graph,
    Sound,
    Input,
    Useful,
} from "./gameUtils.js";
import {
    Actor,
    CollideActor,
    SelfDrawingActor,
    Hit,
    Collider,
} from "./gameEngine.js";
import { getEffectiveConstraintOfTypeParameter, IndexKind, skipPartiallyEmittedExpressions } from "typescript";

export var context;
export var canvas;

var gameLoopTimer;

var images: Images;
var input: Input;

const GameState = 
{
    BREAK: -1,
    PLAYING: 0,
    OVER: 1,
} as const
type GameState = typeof GameState[keyof typeof GameState];

var playerName: string="";
var gameState: GameState = GameState.PLAYING;
var gameScore: number=0;

const KEY_USE = ['d', 'f', 'Enter'];

const ROUGH_SCALE = 3;
const ROUGH_WIDTH = 416;
const ROUGH_HEIGHT = 240;
const SCREEN_WIDTH = ROUGH_SCALE*ROUGH_WIDTH;
const SCREEN_HEIGHT = ROUGH_SCALE*ROUGH_HEIGHT;


var socket = new WebSocket('ws://127.0.0.1:5006');
//var socket = new WebSocket('ws://49.212.155.232:5006');
var isSocketConnect: boolean = false;



window.onload = function() 
{
    canvas = document.getElementById("canvas1");
    if ( canvas.getContext ) 
    {
        context = canvas.getContext("2d");
        context.imageSmoothingEnabled = this.checked;
        context.mozImageSmoothingEnabled = this.checked;
        context.webkitImageSmoothingEnabled = this.checked;
        context.msImageSmoothingEnabled = this.checked;

        input = new Input(KEY_USE);

        Sprite.init();
        images = new Images();

        SceneChage.init();
        //SceneChage.toTitle();
        SceneChage.toMain();
        
    }
}




// 接続
socket.addEventListener('open',function(e){
    isSocketConnect=true;
    console.log('Socket connection succeeded');
    scoresWrite()
});


socket.addEventListener('message',function(e){
    let d=e.data+"";
    console.log("received: "+d);
    let dat=d.split(',');

    let s=`<div class="center">[ SCORE RANKING ]<br></div>`;
    const size=15;
    for (let i=0; i<size; i++)
    {
        let n=(i+1)+"";
        s+=`<span class="rankorder">${n.padStart(2, '0')}</span>`;
        s+=`<span class="rankname">${dat[size+i]===""?"ANONYMOUS":dat[size+i]}</span>`;
        s+=`<span class="score-number">${dat[i]}</span><br>`
    }
    let par1 = document.getElementById("scores");
    par1.innerHTML = s;

    let par2 = document.getElementById("plays");
    par2.innerHTML = `このゲームは計 ${dat[size*2]} 回プレイされました`

});


function checkForm($this)
{
    let str: string=$this.value;
    while(str.match(/[^A-Z^a-z\d\-\_]/))
    {
        str=str.replace(/[^A-Z^a-z\d\-\_]/,"");
    }
    $this.value=str.toUpperCase().substr(0, 16);
    playerName = $this.value;
}









class Images
{

    wallBlock: Graph = Graphics.loadGraph("./images/punicat_24x24.png");
    fieldTile: Graph = Graphics.loadGraph("./images/fieldtile_16x16.png");
    roadTile: Graph = Graphics.loadGraph("./images/roadtile_16x16.png");
    arrowTile: Graph = Graphics.loadGraph("./images/arrow_16x16.png");
    brick: Graph = Graphics.loadGraph("./images/brick_32x32.png");
    rotateHint: Graph = Graphics.loadGraph("./images/rotate_16x16.png");

    punicat: Graph = Graphics.loadGraph("./images/punicat_24x24.png");
    bakugon: Graph = Graphics.loadGraph("./images/bakugon_bomb_24x24.png");
    gorilla: Graph = Graphics.loadGraph("./images/gorilla_24x24.png");
    bakugonSpark: Graph = Graphics.loadGraph("./images/bakugonspark_24x24.png");
    explodeBox: Graph = Graphics.loadGraph("./images/explode_box_16x16.png");
    smoke: Graph = Graphics.loadGraph("./images/smoke_32x32.png");
    star: Graph = Graphics.loadGraph("./images/stars_24x24.png");

    bamboo: Graph = Graphics.loadGraph("./images/grow_bamboo_16x16.png");
    mush: Graph = Graphics.loadGraph("./images/mush_24x16.png");

    lockonCursor: Graph = Graphics.loadGraph("./images/lockon_24x24.png");
    
}


const EActorZ =
{
    CURSOR: -4000,
    EFFECT: -2000,
    MOVABLE: 0,
    BACKGRAPHIC: 2000,
} as const;
type EActorZ = typeof EActorZ[keyof typeof EActorZ];


const EActorColbit = 
{
    CREATURE: 1 << 0,
    BAMBOO: 1 << 1,
    EXPLODE: 1 << 2,
} as const;
type EActorColbit = typeof EActorColbit[keyof typeof EActorColbit];



class SceneChage
{
    static init()
    {
        gameLoopTimer = setInterval( function(){},16);
    }
    static toMain()
    {
        clearInterval(gameLoopTimer);
        Main.setup();
        gameLoopTimer = setInterval( Main.loop, 16 );
    }
    static toTitle()
    {
        clearInterval(gameLoopTimer);
        Title.setup();
        gameLoopTimer = setInterval( Title.loop, 16 );
    }
    
}





//タイトル
class Title
{
    static setup()
    {
        new TitleUi();
        gameState = GameState.BREAK;
    }
    static loop()
    {
        Sprite.allUpdate();
        Sprite.allDrawing();
        if ((input.getMouse.state===Input.Click.LEFT && Useful.between(input.getMouse.x, 0,SCREEN_WIDTH) && Useful.between(input.getMouse.y, 0,SCREEN_HEIGHT)) ||
            input.getKeyDown['Enter']) 
        {
            Sprite.deleteAll(true);
            Sound.playSoundFile("./sounds/startPush.mp3");
            SceneChage.toMain();
        }
    }
}

class TitleUi
{
    constructor()
    {
        // let sp=Sprite.make();
        // Sprite.belong(sp, this);
        // Sprite.drawing(sp, this.drawing);
        // Sprite.offset(sp, 0 , 0, -4096);
        // Useful.drawStringInit();
    }
    drawing(x,y)
    {
        Useful.drawStringEdged(108*ROUGH_SCALE, SCREEN_HEIGHT/2-24, "PUSH 'Enter' TO START THE GAME");
    }
}


//ページ内にスコアランキングを表示する
function scoresWrite()
{
    let send: string="";
    send += gameScore.toString()+",";
    send += playerName;
    if (isSocketConnect)socket.send(send);
}




//メインループ
class Main
{
    static count=0;
    static finishCount=0;
    static level=0;
    static levelUpTime = 120;
    static showLevelUpTime = 0;

    static setup()
    {
        new Arrow();
        new BackgraphiManager();
        new ArrowController();
        new Punicat();
        new PopManager();
    }

    static loop() 
    {
        context.clearRect( 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT );
        Sprite.allUpdate();
        Sprite.allDrawing();

        Main.count++;
        switch(gameState)
        {
            case GameState.PLAYING:
                {
                    //if (Main.count%12===0) gameScore++;
                    break;
                }
            case GameState.OVER:
                {
                    Main.finishCount++;
                    if (Main.finishCount>60*4)
                    {
                        scoresWrite();
                        Sprite.deleteAll(true);
                        SceneChage.toTitle();
                        return;
                    }
                    break;
                }
        }
    }
}




// テスト
class Test extends Actor
{
    x: number = 0;

    constructor()
    {
        super();
        this.spr.setImage(images.punicat, 0, 0, 24, 24);
    }

    protected override update(): void 
    {
        //console.log(`${this.time}`);

        this.x++;
        this.spr.setXY(this.x, this.x);
        super.update();
    }

}



// 矢印に沿って動くユニット
abstract class MovableUnit extends CollideActor
{
    protected matX: number = 0;
    protected matY: number = 0;
    protected nextMatX: number = 0;
    protected nextMatY: number = 0;
    public get getMatX() {return this.matX;}
    public get getMatY() {return this.matY;}

    protected angle: EAngle = 0;

    protected moveTime: number = 0;
    protected moveTimeMax: number = 120;

    private isFirstMove: boolean = false;
    private isOutScreen: boolean = false;
    public get getIsFirstMove(): boolean {return this.isFirstMove;}
    public get getIsOutScreen(): boolean {return this.isOutScreen;}

    protected isItem: boolean = false;
    public get getIsItem() {return this.isItem;}

    constructor(startX: number, startY: number)
    {
        super(new Collider.Rectangle(0, 0, 16, 16), EActorColbit.CREATURE);
        this.moveTime = this.moveTimeMax;
        this.nextMatX = startX;
        this.nextMatY = startY;
        this.matX = this.nextMatX;
        this.matY = this.nextMatY;
        this.isFirstMove = true;
    }


    protected moveArrow()
    {// 進路を決める
        if (this.moveTime >= this.moveTimeMax)
        {
            this.matX = this.nextMatX;
            this.matY = this.nextMatY; 

            let dx, dy;
            this.onDetermineAng();

            if (this.isFirstMove)
            {// 最初の動きならフラグ落とす
                this.isFirstMove = false;
                this.isOutScreen = false;
            }

            [dx, dy] = Angle.toXY(this.angle);
            this.nextMatX = this.matX + dx;
            this.nextMatY = this.matY + dy;
            this.moveTime = 0;

            [this.x, this.y] = Conveyor.getArrowPos(this.matX, this.matY);
        }
        else
        {// 通常移動
            this.moveTime++;
            let x1,y1, x2, y2, rate;
            [x1, y1] = Conveyor.getArrowPos(this.matX, this.matY);
            [x2, y2] = Conveyor.getArrowPos(this.nextMatX, this.nextMatY);
            rate = this.moveTime/this.moveTimeMax;

            this.x = x1 + (x2 - x1) * rate;
            this.y = y1 + (y2 - y1) * rate;
        }

        this.spr.setZ(EActorZ.MOVABLE-this.y/ROUGH_HEIGHT);
    }
    protected abstract setImage(): void;
    protected abstract doCollide(): boolean;

    protected onDetermineAng(): void
    {
        if (this.matX===-1)
        {
            this.angle = EAngle.RIGHT;
            this.isOutScreen = true;
        }
        else if (this.matY===-1)
        {
            this.angle = EAngle.DOWN;
            this.isOutScreen = true;
        }
        else if (this.matX===Conveyor.ARROW_X)
        {
            this.angle = EAngle.LEFT;
            this.isOutScreen = true;
        }
        else if (this.matY===Conveyor.ARROW_Y)
        {
            this.angle = EAngle.UP;
            this.isOutScreen = true;
        }
        else
        {
            this.angle = Arrow.sole.mat[this.matX][this.matY];
        }
    }
}

// ぷにキャット
class Punicat extends MovableUnit
{
    static sole: Punicat = null;
    private isAlive = true;
    public get getIsAlive() { return this.isAlive; }

    constructor()
    {
        super(Conveyor.ARROW_X/2|0, Conveyor.ARROW_Y/2|0);
        Punicat.sole = this;
    }

    protected override update(): void 
    {
        if (this.doCollide()===true) return;
        this.moveArrow();
        super.update();
        this.spr.setXY(this.x-4, this.y-8);
        this.setImage();
    }

    protected override doCollide(): boolean 
    {
        let hit: CollideActor = this.getHit();
        if (this.getHit()!==null)
        {
            let unit = hit as MovableUnit;
            if (unit.getIsItem===false)
            {
                new Effect.Star.Generator(this.x+8, this.y+8, 1);
                Sprite.delete(this.spr);
                return true;
            }
        }

        if (Hit.getHitRect(this.x, this.y, 16, 16, EActorColbit.EXPLODE)!==null)
        {
            new Effect.Star.Generator(this.x+8, this.y+8, 1);
            Effect.Smoke.generate(this.x+8, this.y+8);
            Sprite.delete(this.spr);
            return true;
        }
        return false;
    }

    protected override setImage() 
    {
        this.spr.setImage(images.punicat,
        Useful.floorDivide(this.time, this.moveTimeMax/4|0, 4)*24, this.angle*24, 24, 24);
    }

    protected override destructor(): void 
    {
        this.isAlive = false;
        super.destructor();   
    }

}


// ゴリラ
class Gorilla extends MovableUnit
{
    // 点と点の間からスタート
    constructor(startPoint: [number, number], nextPoint: [number, number])
    {
        super(...startPoint);
        [this.nextMatX, this.nextMatY] = nextPoint;
        this.moveTimeMax *= 5;
        this.moveTime = this.moveTimeMax/2|0;
    }

    protected override update(): void 
    {
        if (this.getIsOutScreen) 
        {// 外に出た
            Sprite.delete(this.spr);
            return;
        }
        if (this.doCollide()===true) return;
        this.moveArrow();
        super.update();
        this.spr.setXY(this.x-4, this.y-8);
        this.setImage();
    }

    protected override doCollide(): boolean 
    {
        if (Hit.getHitRect(this.x, this.y, 16, 16, EActorColbit.EXPLODE)!==null)
        {
            Effect.Smoke.generate(this.x+8, this.y+8);
            Sprite.delete(this.spr);
            return true;
        }
        return false;
    }

    protected override setImage() 
    {
        this.spr.setImage(images.gorilla,
        Useful.floorDivide(this.time, 40, 2)*24, 0, 24, 24);
    }

    // プレイヤーに近づいていくようにする
    protected override onDetermineAng(): void 
    {
        let dx: number=0, dy: number=0;
        if (this.matX<Punicat.sole.getMatX) dx = 1;
        if (this.matX>Punicat.sole.getMatX) dx = -1;
        if (this.matY<Punicat.sole.getMatY) dy = 1;
        if (this.matY>Punicat.sole.getMatY) dy = -1;
        if (dx!==0 && dy!==0)
        {
            if (Useful.rand(2)===0) dx = 0; else dy = 0;
        }
        this.angle = Angle.toAng(dx, dy);

        // 進行方向に矢印を書き換え
        Arrow.sole.mat[this.matX][this.matY] = this.angle;
    }

}



// 外からやってくるユニット
abstract class GoInsideUnit extends MovableUnit
{
    private hasFirstGlimpsed: boolean;
    private glimpseTime: number;

    constructor()
    {
        let x, y;
        if (Useful.rand(2)===0)
        {
            x = Useful.rand(2)===0 ? -1 : Conveyor.ARROW_X
            y = Useful.rand(Conveyor.ARROW_Y)
        }
        else
        {
            y = Useful.rand(2)===0 ? -1 : Conveyor.ARROW_Y
            x = Useful.rand(Conveyor.ARROW_X)
        }
        super(x, y);

        this.hasFirstGlimpsed = false;
        this.glimpseTime = 0;
    }

    protected override update(): void 
    {
        if (this.getIsOutScreen) 
        {// 外に出た
            Sprite.delete(this.spr);
            return;
        }
        if (this.canFirstFlimpse()) this.firstGlimpse()
        this.moveArrow();
        super.update();
        this.setXY();
        this.setImage();
    }

    protected abstract setXY(): void;

    // 出てきたときにチラっとする
    private canFirstFlimpse(): boolean
    {
        return !this.hasFirstGlimpsed && !this.getIsFirstMove
    }
    private firstGlimpse(): void
    {
        if (this.moveTime>this.moveTimeMax/4 || this.glimpseTime>0)
        {
            this.moveTime -= 1.3;
            this.glimpseTime++;
            if (this.glimpseTime>15)
            {
                this.hasFirstGlimpsed = true;
            }
        }
    }
}




// バクゴンさん
class Bakugon extends GoInsideUnit
{
    private sparkSpr: Sprite;
    private explodeTime: number; // 爆発時刻

    constructor()
    {
        super();

        // 火花エフェクト
        this.sparkSpr = new Sprite()
        this.sparkSpr.setZ(EActorZ.EFFECT);
        this.sparkSpr.setLink(this.spr);
        this.explodeTime = 60 * 15;
    }

    protected override update(): void 
    {
        if (this.doCollide()) return;
        if (this.doTimeExplode()) return;
        super.update();
    }

    protected override doCollide(): boolean 
    {
        if ((this.time>1 && this.getHit()!==null) || Hit.getHitRect(this.x, this.y, 16, 16, EActorColbit.EXPLODE)!==null)
        {
            new BakugonExplosion(this.x+8, this.y+8);
            Sprite.delete(this.spr);
            return true;
        }
        return false;
    }
    
    protected override setImage(): void
    {
        if (this.time<this.explodeTime - 120)
        {// 通常
            this.spr.setImage(images.bakugon,
                Useful.floorDivide(this.time, this.moveTimeMax/2|0, 4)*24, 0, 24, 24);
        }
        else
        {// 爆発しそう
            this.spr.setImage(images.bakugon,
                Useful.floorDivide(this.time, this.moveTimeMax/2|0, 4)*24, 
                (this.time%10)>5 ? 0 : 24, 24, 24);
        }
        
        this.sparkSpr.setImage(images.bakugonSpark, Useful.floorDivide(this.time, this.moveTimeMax/4|0, 4)*24, 0, 24, 24);
    }
    protected override setXY(): void 
    {
        this.spr.setXY(this.x-4, this.y-8);
    }

    private doTimeExplode(): boolean
    {
        if (this.time>this.explodeTime)
        {// 爆発
            new BakugonExplosion(this.x+8, this.y+8);
            Sprite.delete(this.spr);
            return true;
        }
        return false;
    }

    protected override destructor(): void 
    {
        super.destructor();
        Sprite.delete(this.sparkSpr);
    }
}


// 松茸
class Mush extends GoInsideUnit
{
    private lifespan = 60 * 30;

    constructor()
    {
        super();
        this.moveTime = (this.moveTime * 1.5)|0;
        this.moveTimeMax = this.moveTime;
        this.isItem = true;
    }

    protected override update(): void 
    {
        if (this.doCollide()===true) return;
        if (this.time>this.lifespan) 
        {
            Sprite.delete(this.spr);
            return;
        }
        super.update();
    }

    protected override doCollide(): boolean 
    {
        if (Hit.getHitRect(this.x, this.y, 16, 16, EActorColbit.EXPLODE)!==null)
        {
            Effect.Smoke.generate(this.x+8, this.y+8);
            Sprite.delete(this.spr);
            return true;
        }
        return false;
    }

    protected override setImage(): void
    {
        this.spr.setImage(images.mush,
            Useful.floorDivide(this.time, this.moveTimeMax/4|0, 4)*24, 0, 24, 16);
        
        if (this.time>this.lifespan-180)
        {
            if ((this.time%10>5))
            {
                this.spr.setImage(null);
            }
        }
        
    }
    protected override setXY(): void 
    {
        this.spr.setXY(this.x-4, this.y-4);
    }

}

// タケノコ
class Bamboo extends CollideActor
{
    private lifespan: number = 60 * 10;
    private point1: [number, number];
    private point2: [number, number];

    constructor()
    {
        super(new Collider.Rectangle(0, 0, 16, 16), EActorColbit.BAMBOO);

        // 隣同士矢印2地点をランダムにとってその間の座標とする
        let x1, y1, x2, y2
        while (true)
        {
            x1 = Useful.rand(Conveyor.ARROW_X); 
            y1 = Useful.rand(Conveyor.ARROW_Y);
            x2 = Useful.rand(Conveyor.ARROW_X);
            y2 = Useful.rand(Conveyor.ARROW_Y);
            if (x1===x2 && Math.abs(y1-y2)===1 || y1===y2 && Math.abs(x1-x2)===1)
            {
                this.x = (Conveyor.getArrowPos(x1, y1)[0] + Conveyor.getArrowPos(x2, y2)[0])/2;
                this.y = (Conveyor.getArrowPos(x1, y1)[1] + Conveyor.getArrowPos(x2, y2)[1])/2;
                if (this.getHit()===null)
                {// その場所にないならオッケー
                    this.point1 = [x1, y1];
                    this.point2 = [x2, y2];
                    //this.colbit = EActorColbit.CREATURE | EActorColbit.BAMBOO;
                    break;
                }
            }
        }
    }
    protected override update(): void 
    {
        if (this.time>this.lifespan)
        {// ゴリラ出して消す
            new Gorilla(this.point1, this.point2);
            Sprite.delete(this.spr);
            return;
        }
        if (this.time<40)
        {// 最初だけ成長アニメ
            this.spr.setImage(images.bamboo, 
                Useful.floorDivide(this.time, 40, 4)*16, 0, 16, 16);
        }
        if (this.time > this.lifespan-180)
        {// 消える前にちらちらする
            this.spr.setImage(this.time%10<5 ? null : images.bamboo)
        }
        if (this.doCollide()===true) return;
        super.update();
        this.spr.setXY(this.x, this.y - 4)
    }

    protected doCollide(): boolean 
    {
        if (Punicat.sole.getIsAlive===true && this.getHitWith(Punicat.sole)===true)
        {
            new Effect.Star.Generator(this.x+8, this.y+8, 0);
            Sprite.delete(this.spr);
            return true;
        }
        return false;
    }
}




// 湧き出すものたちの管理者
class PopManager extends Actor
{
    constructor()
    {
        super();
    }
    protected override update(): void 
    {
        if (this.time%60===0)
        {
            new Bakugon();
        }
        if (this.time%180===0)
        {
            new Mush();
        }
        if (this.time%120===0)
        {
            new Bamboo();
        }
        super.update();    
    }
}





/*
    エフェクト
    基準点は出来るだけエフェクトの中心にとる
*/
namespace Effect
{
    class EffectBase extends Actor
    {
        constructor()
        {
            super();
            this.spr.setZ(EActorZ.EFFECT);
        }
    }

    // 爆破
    export class Explode extends EffectBase
    {
        private constructor(private x: number, private y: number)
        {
            super();
        }
        protected override update(): void 
        {
            const span = 16;
            if (this.time>=span)
            {
                Sprite.delete(this.spr);
                return;
            }
            this.spr.setXY(this.x, this.y);
            this.spr.setImage(images.explodeBox,
                Useful.floorDivide(this.time, span, 4)*16, 0, 16, 16);
            super.update();
        }
        

        public static Generator = class Generator extends Actor
        {
            public constructor(private x: number, private y: number)
            {
                super();
                this.x -= 8; this.y -= 8;
            }
            protected override update(): void 
            {
                if (this.time % 3===0)
                {
                    for (let i=0; i<6; i++)
                    {
                        let x1, y1;
                        let r = Math.cos(this.time/30 * Math.PI)*32;
                        let theta = (i*60 + this.time * (60/15)) /180*Math.PI;
                        x1 = this.x + r * Math.cos(theta);
                        y1 = this.y + r * Math.sin(theta);
                        new Explode(x1, y1)
                    }

                    // for (let i=0; i<3; i++)
                    // {
                    //     let x1, y1;
                    //     let r = Useful.rand(32);
                    //     let theta = Useful.rand(360)/180*Math.PI;
                    //     x1 = this.x + r * Math.cos(theta);
                    //     y1 = this.y + r * Math.sin(theta);
                    //     new Explode(x1, y1)
                    // }
                }
                if (this.time>30)
                {
                    Sprite.delete(this.spr);
                    return;
                }
                super.update();
            }
        }

    }

    // スモーク
    export class Smoke extends EffectBase
    {
        private constructor(private x: number, private y: number)
        {
            super();
        }
        protected override update(): void 
        {
            const span = 20;
            if (this.time>=span * 2)
            {
                Sprite.delete(this.spr);
                return;
            }
            this.spr.setXY(this.x, this.y);
            this.spr.setImage(images.smoke,
                Useful.floorDivide(this.time, span, 4)*32, 0, 32, 32);
            super.update();
        }
        public static generate(x, y)
        {
            x -= 16; y -= 8;
            new Smoke(x - 16, y - 16);
            new Smoke(x + 16, y - 16);
            new Smoke(x - 16, y + 16);
            new Smoke(x + 16, y + 16);
        }
    }

    // スター
    export class Star extends EffectBase
    {
        private vel = 1;
        private constructor(
            private kind: number, 
            private x: number,
            private y: number,
            private vx: number,
            private vy: number)
        {
            super();
            this.spr.setXY(x, y);
            this.spr.setImage(images.star, this.kind*24, 0, 24, 24);
            this.spr.SetBlendPal(200);
        }
        
        protected override update()
        {
            this.x+=this.vx * this.vel;
            this.y+=this.vy * this.vel;
            this.vel += 0.05;
            this.spr.setXY(this.x, this.y);

            if (this.time>180) {Sprite.delete(this.spr); return;}
            super.update();
        }
        static generate(x: number, y: number, kind: number)
        {
            for (let i=-6; i<=6; i++)
            {
                let theta=(-90+i*30)/180*Math.PI;
                let vx=Math.cos(theta)*2;
                let vy=Math.sin(theta)*2;

                new Effect.Star(kind, x-12, y-12, vx, vy);
            }
        }
        public static Generator = class Generator extends Actor
        {
            public constructor(private x: number, private y: number, private kind: number)
            {
                super();
            }
            protected override update(): void 
            {
                if (this.time % 10===0)
                {
                    Star.generate(this.x, this.y, this.kind)
                }
                if (this.time>=30)
                {
                    Sprite.delete(this.spr);
                    return;
                }
                super.update();
            }
        }
    }
}


class BakugonExplosion extends Effect.Explode.Generator
{
    col: CollideActor;

    public constructor(x, y)
    {
        super(x, y);

        this.col = new CollideActor(new Collider.Rectangle(-24, -24, 48, 48), EActorColbit.EXPLODE);
        this.col.setX(x-8);
        this.col.setY(y-8);
    }
    protected destructor(): void 
    {
        Sprite.delete(this.col.getSpr);
        super.destructor();    
    }
}






const EAngle = 
{
    RIGHT: 0,
    DOWN: 1,
    LEFT: 2,
    UP: 3,
} as const
type EAngle = typeof EAngle[keyof typeof EAngle];

class Angle
{
    static toXY(ang: EAngle): [number, number]
    {
        let ret: [number, number];
        switch(ang)
        {
            case EAngle.UP:
                ret = [0,-1];break;
            case EAngle.RIGHT:
                ret = [1, 0];break;
            case EAngle.DOWN:
                ret = [0, 1];break;
            case EAngle.LEFT:
                ret = [-1, 0];break;
        }
        return ret; 
    }

    static toAng(x: number, y: number): EAngle
    {
        // atan2の定義域は-pi~pi
        let theta = Math.atan2(y, x);

        if (Useful.between(theta, -Math.PI/4, Math.PI/4))
        {
            return EAngle.RIGHT;
        }
        else if (Useful.between(theta, -Math.PI*3/4, -Math.PI/4))
        {
            return EAngle.UP;
        }
        else if (Useful.between(theta, Math.PI/4, Math.PI*3/4))
        {
            return EAngle.DOWN;
        }
        else
        {
            return EAngle.LEFT;
        }
    }
}



// 矢印管理
class Arrow
{
    static sole: Arrow = null;
    mat: EAngle[][]

    constructor()
    {
        Arrow.sole = this;

        this.mat = Useful.initMat2<EAngle>(Conveyor.ARROW_X, Conveyor.ARROW_Y)

        for (let y=0; y<Conveyor.ARROW_Y; y++)
        {
            for (let x=0; x<Conveyor.ARROW_X; x++)
            {
                this.mat[x][y] = Useful.rand(4) as EAngle;
            }
        }
    }
}


// 矢印を動かす
class ArrowController extends Actor
{
    timeOnPush: number = 0;
    cursorX: number = 0;
    cursorY: number = 0;
    hintSprL: Sprite = null;
    hintSprR: Sprite = null;

    constructor()
    {
        super();
        this.spr.setImage(null, 0, 0, 24, 24);
        this.spr.setZ(EActorZ.CURSOR);

        this.hintSprL = new Sprite(images.rotateHint, 0, 0, 16, 16);
        this.hintSprL.setZ(EActorZ.CURSOR - 1)
        this.hintSprR = new Sprite(images.rotateHint, 0, 0, 16, 16);
        this.hintSprR.setZ(EActorZ.CURSOR - 1)
        this.hintSprL.setFlip(true);
    }

    protected override update(): void
    {
        this.spr.setImage(null);
        
        [this.cursorX, this.cursorY] = input.getMouse.getXY;
        this.cursorX /= 3; this.cursorY/= 3;


        for (let x=0; x<Conveyor.ARROW_X; x++)
        {
            for (let y=0; y<Conveyor.ARROW_Y; y++)
            {
                let [x1, y1] = Conveyor.getArrowPos(x, y)
                let w = 8;

                if (Hit.checkRectReck(
                    x1-w, y1-w, 16+w*2, 16+w*2, 
                    this.cursorX, this.cursorY, 1, 1
                ))
                {
                    this.rotateArrow(x, y)
                    this.spr.setXY(x1-4, y1-4);
                    this.spr.setImage(images.lockonCursor);
                    break;
                }
            }
        }

        this.updateHint();
        super.update();
    }

    private rotateArrow(x: number, y: number)
    {   
        if (this.getCanRotateR())
        {
            if (this.timeOnPush+1 !== this.time) Arrow.sole.mat[x][y] += 1;
            this.timeOnPush = this.time;
        }
        else if (this.getCanRotateL())
        {
            if (this.timeOnPush+1 !== this.time) Arrow.sole.mat[x][y] += -1;
            this.timeOnPush = this.time;
        }
        Arrow.sole.mat[x][y] = ((Arrow.sole.mat[x][y]+4) % 4) as EAngle;
    }

    private getCanRotateR()
    {
        return (input.getMouse.state === Input.Click.RIGHT)
        || (input.getKeyDown['f']);
    }
    private getCanRotateL()
    {
        return (input.getMouse.state === Input.Click.LEFT)
        || (input.getKeyDown['d']);;
    }

    private updateHint()
    {
        
        this.hintSprL.setXY(this.cursorX-8-12, this.cursorY-16);
        this.hintSprR.setXY(this.cursorX-8+12, this.cursorY-16);

        this.hintSprL.SetBlendPal(128)
        this.hintSprR.SetBlendPal(128)

        if (this.getCanRotateL()) this.hintSprL.SetBlendPal(255)
        if (this.getCanRotateR()) this.hintSprR.SetBlendPal(255)
    }


}




// コンベア制御メソッド
class Conveyor
{
    public static isArrowTile(x: number, y: number): boolean
    {
        return (x+1) % 3===0 && (y+2) % 3===0;
    }

    public static readonly ARROW_X = 8;
    public static readonly ARROW_Y = 5;
    public static readonly ARROW_DISTANCE = 16 * 2;
    public static getArrowPos(x: number, y: number): [number, number]
    {
        let ret: [number, number] = [(x * 3 + 2) * 16, (y * 3 + 1) * 16];
        return ret;
    }
}







// 背景管理
class BackgraphiManager extends Actor
{
    static sole: BackgraphiManager = null;

    constructor()
    {
        super();
        new Floorlayer();
        new TileLayer();
    }

}


// 基底フィールドレイヤー
abstract class FieldLayerBase extends SelfDrawingActor
{
    protected gridUnit = 16;
    protected z: number;

    protected constructor(z: number);
    protected constructor(z: number, gridUnit: number);


    protected constructor(z: number, gridUnit?: number)
    {
        super();
        this.z = z;
        if (gridUnit!==undefined) this.gridUnit = gridUnit;
        this.setSprZ();
    }

    protected setSprZ()
    {
        this.spr.setZ(this.z);
    }

    protected override drawing(hX: number, hY: number): void 
    {
        for (let x=0; x<=(ROUGH_WIDTH/this.gridUnit|0); x++)
        {
            for (let y=0; y<=(ROUGH_HEIGHT/this.gridUnit|0); y++)
            {
                let displayX = (hX|0) + x * this.gridUnit;
                let displayY = (hY|0) + y * this.gridUnit;
                displayX *= ROUGH_SCALE;
                displayY *= ROUGH_SCALE;

                this.chipDrawing(x, y, displayX, displayY);
            }
        }
    }

    protected abstract chipDrawing(matX: number, matY:number, dpX: number, dpY: number): void;
}

// 奥床
class Floorlayer extends FieldLayerBase
{
    constructor()
    {
        super(EActorZ.BACKGRAPHIC);
    }

    protected override chipDrawing(matX: number, matY: number, dpX: number, dpY: number): void
    {
        images.fieldTile.drawGraph(dpX, dpY, 0, 0, 16, 16, ROUGH_SCALE);
    }
}


// タイルレイヤー
class TileLayer extends SelfDrawingActor
{
    constructor()
    {
        super();
        this.spr.setZ(EActorZ.BACKGRAPHIC-1);
    }

    protected override drawing(hX: number, hY: number): void 
    {
        for (let x=0; x<Conveyor.ARROW_X; x++)
        {
            for (let y=0; y<Conveyor.ARROW_Y; y++)
            {
                // 矢印
                images.arrowTile.drawGraph(...Useful.xyToRough(Conveyor.getArrowPos(x, y)), Arrow.sole.mat[x][y]*16, 0, 16, 16, ROUGH_SCALE);
            }
        }

        for (let x=-1; x<Conveyor.ARROW_X; x++)
        {
            for (let y=-1; y<Conveyor.ARROW_Y; y++)
            {
                let dpX = (x * 3 + 2) * 16 * ROUGH_SCALE;
                let dpY = (y * 3 + 1) * 16 * ROUGH_SCALE;

                // 横縞
                images.roadTile.drawGraph(dpX + 16*ROUGH_SCALE, dpY, 16, 0, 16, 16, ROUGH_SCALE);
                images.roadTile.drawGraph(dpX + 32*ROUGH_SCALE, dpY, 16, 0, 16, 16, ROUGH_SCALE);

                // 縦縞
                images.roadTile.drawGraph(dpX, dpY + 16*ROUGH_SCALE, 0, 0, 16, 16, ROUGH_SCALE);
                images.roadTile.drawGraph(dpX, dpY + 32*ROUGH_SCALE, 0, 0, 16, 16, ROUGH_SCALE);

                // レンガ
                if (!Useful.between(x, 0, 8-2) || !Useful.between(y, 0, 5-2)) images.brick.drawGraph(dpX + 16*ROUGH_SCALE, dpY + 16*ROUGH_SCALE, 0, 0, 32, 32, ROUGH_SCALE);
            }
        }

        // for (let x=0; x<8-1; x++)
        // {
        //     for (let y=0; y<5-1; y++)
        //     {
        //         // ブロック
        //         let dpX = (x * 3 + 2) * 16 * ROUGH_SCALE;
        //         let dpY = (y * 3 + 1) * 16 * ROUGH_SCALE;

        //         if ((x+y+2) % 2 === 1) images.brick.drawGraph(dpX + 16*ROUGH_SCALE, dpY + 16*ROUGH_SCALE, 0, 0, 32, 32, ROUGH_SCALE);
        //     }
        // }



    }
}


























