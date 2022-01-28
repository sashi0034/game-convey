let canvas;
let context;
let gameLoopTimer;
let curPosX = 0;
let curPosY = 0;

const CLICK_NONE = -1, CLICK_RIGHT = 0;
let mouseState = -1;

let images: Images;

let playerName: string="";
let gameState: number=0;
let gameScore: number=0;

const KEY_USE = ['w', 'a', 's', 'd', 'Enter'];
let isKeyDown = {};


const GAME_BREAK = -1;
const GAME_PLAYING=0;
const GAME_OVER=1;

const ROUGH_SCALE = 3;
const ROUGH_WIDTH = 416;
const ROUGH_HEIGHT = 240;
const SCREEN_WIDTH = ROUGH_SCALE*ROUGH_WIDTH;
const SCREEN_HEIGHT = ROUGH_SCALE*ROUGH_HEIGHT;

const COL_ICON = 1 << 0;


let socket = new WebSocket('ws://127.0.0.1:5006');
//let socket = new WebSocket('ws://49.212.155.232:5006');
let isSocketConnect: boolean = false;



window.onload = function() {
    canvas = document.getElementById("canvas1");
    if ( canvas.getContext ) {
        context = canvas.getContext("2d");
        context.imageSmoothingEnabled = this.checked;
        context.mozImageSmoothingEnabled = this.checked;
        context.webkitImageSmoothingEnabled = this.checked;
        context.msImageSmoothingEnabled = this.checked;

        Sprite.init();
        images = new Images();

        SceneChage.init();
        //SceneChage.toTitle();
        SceneChage.toMain();
        
        document.onmousemove = onMouseMove;   // マウス移動ハンドラ
        document.onmouseup = onMouseUp;       // マウスアップハンドラ
        document.onmousedown = onMouseDown;   // マウスダウンハンドラ

        onKeyInit();
        document.addEventListener("keypress", onKeyDown); // キーボード入力
        document.addEventListener("keyup", onKeyUp);


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
        s+=`<span class="rankname">${dat[size+i]==""?"ANONYMOUS":dat[size+i]}</span>`;
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


function onMouseMove( e ) {
    curPosX = e.clientX;
    curPosY = e.clientY;
    let pos = clientToCanvas( canvas, curPosX, curPosY );
    curPosX = pos.x + window.pageXOffset;
    curPosY = pos.y + window.pageYOffset;
}

function onKeyInit() {
    for (let i=0; i<KEY_USE.length; i++)
    {
        isKeyDown[KEY_USE[i]] = false;
    }
}

function onKeyDown(e) {
    //console.log(e.key);
    for (let i=0; i<KEY_USE.length; i++)
    {
        let c = KEY_USE[i];
        if (e.key === c || e.key === c.toUpperCase())
        {
            isKeyDown[c] = true;
        }
    }
}

function onKeyUp ( e ){
    for (let i=0; i<KEY_USE.length; i++)
    {
        let c = KEY_USE[i];
        if (e.key === c || e.key === c.toUpperCase())
        {
            isKeyDown[c] = false;
        }
    }
}



function onMouseKey( e ) {
    mouseState = -1;
}


function onMouseDown( e ) {
    mouseState = e.button;
}

function onMouseUp( e ) {
    mouseState = -1;
}


function clientToCanvas(canvas, clientX, clientY) {
    let cx = clientX - canvas.offsetLeft + document.body.scrollLeft;
    let cy = clientY - canvas.offsetTop + document.body.scrollTop;
    //console.log(clientY , canvas.offsetTop , document.body.scrollTop);
    let ret = {
        x: cx,
        y: cy
    };
    return ret;
}




class Images
{

    wallBlock: Graph = Graphics.loadGraph("./images/punicat_24x24.png");
    fieldTile: Graph = Graphics.loadGraph("./images/fieldtile_24x24.png");

    punicat: Graph = Graphics.loadGraph("./images/punicat_24x24.png");

}


const ACTOR_Z =
{
    PLAYER: 0,
    BACKGRAPHIC: 2000,
} as const;
type ActorZ = typeof ACTOR_Z[keyof typeof ACTOR_Z];



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
        gameState = GAME_BREAK;
    }
    static loop()
    {
        Sprite.allUpdate();
        Sprite.allDrawing();
        if ((mouseState==0 && Useful.between(curPosX,0,SCREEN_WIDTH) && Useful.between(curPosY,0,SCREEN_HEIGHT)) ||
            isKeyDown['Enter']) 
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
        new Test();
        new FieldManager();

        
    }

    static loop() 
    {
        context.clearRect( 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT );
        Sprite.allUpdate();
        Sprite.allDrawing();

        Main.count++;
        switch(gameState)
        {
            case GAME_PLAYING:
                {
                    //if (Main.count%12==0) gameScore++;
                    break;
                }
            case GAME_OVER:
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



// 基底オブジェクト
class Actor
{
    spr: Sprite;
    time: number = 0;

    constructor()
    {
        this.spr = new Sprite();
        this.spr.setUpdateMethod(Actor.callUpdate)
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
}

abstract class ActorDrawingBySelf extends Actor
{
    constructor()
    {
        super();
        this.spr.setDrawingMethod(ActorDrawingBySelf.callDrawing);
    }

    private static callDrawing(hSpr: Sprite, hX: number, hY: number): void
    {
        let self: ActorDrawingBySelf = hSpr.getBelong();
        self.drawing(hX, hY);
    }

    protected abstract drawing(hX: number, hY: number): void;
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







// フィールド管理
class FieldManager extends Actor
{
    static own: FieldManager = null;

    constructor()
    {
        super();
        new Floorlayer();
    }

}


// 基底フィールドレイヤー
abstract class FieldLayerBase extends ActorDrawingBySelf
{
    protected gridUnit: number = 24;
    protected z: number;

    constructor(z)
    {
        super();
        this.z = z;
        this.setSprZ();
    }

    protected setSprZ()
    {
        console.log(this.z);
        this.spr.setZ(this.z);
    }

    protected override drawing(hX: number, hY: number): void 
    {
        for (let x=0; x<(ROUGH_WIDTH/this.gridUnit|0); x++)
        {
            for (let y=0; y<(ROUGH_HEIGHT/this.gridUnit|0); y++)
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

// 床
class Floorlayer extends FieldLayerBase
{
    constructor()
    {
        super(ACTOR_Z.BACKGRAPHIC);
        console.log(this.z);
    }

    protected override chipDrawing(matX: number, matY: number, dpX: number, dpY: number): void
    {
        images.fieldTile.drawGraph(dpX, dpY, 0, 0, 24, 24, ROUGH_SCALE);
    }
}















































// お役立ちクラス
class Useful
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
            arr[i]*=ROUGH_SCALE;
        }
        return arr;
    }
    static boxToRough(arr: [number, number, number, number]): [number, number, number, number]
    {
        for (let i=0; i<arr.length; i++)
        {
            arr[i]*=ROUGH_SCALE;
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
        let ret = n%m;
        return ret<0 ? ret+m : ret;
    }
}














class Sprite
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




// 画像
class Graph
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
class Graphics
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


class Sound
{
    static playSoundFile(path, vol=0.5, loop: boolean=false): HTMLAudioElement
    {
        let music: HTMLAudioElement = new Audio(path);
        music.volume=vol;
        music.loop = false;
        music.play();

        if (loop) 
        {
            music.addEventListener("ended", function () {
                music.currentTime = 0;
                music.play();
              }, false);
        }

        return music;
    }
}

















