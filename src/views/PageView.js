/*** PageView ***/
var Page;
// define this module in Require.JS
define(function(require, exports, module) {

    // Import additional modules to be used in this view 
    var Transitionable  = require('famous/transitions/Transitionable');
    var StateModifier   = require('famous/modifiers/StateModifier');
    var ImageSurface    = require('famous/surfaces/ImageSurface');
    var Easing          = require('famous/transitions/Easing');
    var GenericSync     = require('famous/inputs/GenericSync');
    var EventHandler    = require('famous/core/EventHandler');
    var MouseSync       = require('famous/inputs/MouseSync');
    var TouchSync       = require('famous/inputs/TouchSync');
    var Transform       = require('famous/core/Transform');
    var Modifier        = require('famous/core/Modifier');
    var Surface         = require('famous/core/Surface');
    var View            = require('famous/core/View');
    
    
    GenericSync.register({'mouse': MouseSync, 'touch': TouchSync});
    
    var ContentView = require('views/ContentView');
    
    var eventHandler    = new EventHandler();

    // Constructor function for our PageView class
    function PageView() {
        // Applies View's constructor function to PageView class
        View.apply(this, arguments);
        
        this.currentPage = null;
        
        _renderPages.call(this);
        _setListeners.call(this);
        _pageMove.call(this);
        
    }

    // Establishes prototype chain for PageView class to inherit from View
    PageView.prototype = Object.create(View.prototype);
    PageView.prototype.constructor = PageView;

    // Default options for PageView class
    PageView.DEFAULT_OPTIONS = {
        baseUrl: "https://s3.amazonaws.com/elasticbeanstalk-us-east-1-538093400772/mcleanErskine/",
        fadeInCurve: { duration: 1000, curve: Easing.outBack },
        defaultAngle: 0.001,
        pagePosition: 0.04,
        pageOffset: 320,
        yOffset: 0.8, 
        pageData: {}
    };

    // Define your helper functions and prototype methods here
    function _pageMove(){
        this.on('slide', function(data){
            var moveDistance = data.delta / window.innerWidth;
            
            this.origins.forEach(function(origin, z){
                var move = [origin.get()[0] + moveDistance, origin.get()[1]];
                
                origin.set(move);
            });
        
        });
    }
    
    function _setListeners(x){
        // var trans = { duration: 1000, curve: 'easeIn' };
        
        // this.otherSideModifiers[x]          //Show content Surface
        //     .transformFrom(Transform.translate(0,0,-1));
            
        // this.opacities[x].set(0, {duration: 150, curve: 'easeIn'}, 
        //     function(){
            
        //     this.scales[x].set(0.2, trans);
        //     this.angles[x].set(this.options.defaultAngle, trans);
            
        // }.bind(this));
        
        // this.currentPage = null;
    }
    
    
    function _renderPages(){
        var opts        = this.options, 
            pageOffset  = opts.pagePosition,
            scaleTo     = window.innerWidth / 4 - 50;
        
        this.otherSideModifiers = [];
        this.pageModifiers = [];
        this.pageRotations = [];
        this.opacities = [];
        this.origins = [];
        this.angles = [];
        this.scales = [];
        this.align  = [];
        this.z = [];
        
        
        opts.pageData.forEach(function(page, i){
            var offset = new Transitionable([pageOffset, opts.yOffset]),
                angle = new Transitionable(opts.defaultAngle),
                z = new Transitionable(0.122222),
                opacity = new Transitionable(0),
                scale = new Transitionable(0);
                
            
            var singlePage = new Surface({
                classes: [page.title, 'double-sided'],
                properties: {
                    backgroundColor: 'rgba(255, 255, 255, 0.30)',
                    border: "2px solid rgba(0, 0, 0, 0.23)",
                    textAlign: 'right',
                    cursor: 'pointer'
                } 
            });
            
            pageModifier = new Modifier();
                   
            //Add Transitionable to move the elemnts around via align and origin
            pageModifier
                .transformFrom(function(){ return Transform.rotateY(angle.get()); })
                .originFrom(function(){ return offset.get(); })
                .alignFrom(function(){ return offset.get(); });
            
            var scaleModifier = new Modifier({
                transform: function(){
                    var startScale = scale.get();
                    return Transform.scale(startScale, startScale, startScale);
                }
            });
            
            var zModifier = new Modifier({
                transform: function(){
                    return Transform.translate(0,0,0);
                }
            });
            
            // Sync touch and mouse for moving pages side to side
            var move = new GenericSync(
                ['mouse', 'touch'],
                { direction : GenericSync.DIRECTION_X }
            );
            // move.addSync(['click']);
            
            singlePage.pipe(move);
            
            move.on('update', function(data){
                
                this._eventOutput.emit('slide', data);
            }.bind(this));
            
            move.on('end', function(data){ 
                if(Math.abs(data.position) < 1){ this.changePage(page); }
            }.bind(this));
            
            // CREATE CONTENT SIDE 
            
            var content = new ContentView({ pageInfo : page });

            var otherSideModifier = new Modifier();
            
            otherSideModifier
                .originFrom(function(){ return offset.get(); })
                .alignFrom(function(){ return offset.get(); })
                .transformFrom(Transform.translate(0,0,-1))
                .opacityFrom(function(){ return opacity.get(); });
            
            var otherSideScaleModifier = new Modifier({
                transform: function(){
                    var startScale = scale.get();
                    return Transform.scale(startScale, startScale, startScale);
                }
            });
            
            content.on('zoomOut', function(){ this.zoomOut(i); return false; }.bind(this));
            
            this.otherSideModifiers.push(otherSideModifier);
            this.pageModifiers.push(pageModifier);
            this.opacities.push(opacity);
            this.origins.push(offset);
            this.angles.push(angle);
            this.scales.push(scale);
            this.z.push(z);
            
            
            this
                .add(zModifier)
                .add(pageModifier)
                .add(scaleModifier)
                .add(singlePage);


            // Add the other side that has the content
            this
                .add(otherSideModifier)
                .add(otherSideScaleModifier)
                .add(content);
            
            pageOffset += 0.3;
            
            scale.set(0.2, {duration: 2000, curve: Easing.outBack});
            
        }.bind(this));
        
        
    }
    

    PageView.prototype.toggle = function(){
        console.log('there');
        
         angle.set(1, { duration: 2000, curve: 'easeInOut' });
    };
    
    PageView.prototype.boxSize = function(){
        var windowHeight = window.innerHeight,
            windowWidth = window.innerWidth,
            boxSize = [200,300];
            
        return boxSize;
    };
    
    PageView.prototype.changePage = function(page){
        var trans = { duration: 600, curve: 'easeIn' },
            currentPage = this.currentPage,
            center = [0.5, 0.5],
            newPage = page.id,
            x = newPage;
        
        
        if(newPage === currentPage){ return; }

        //Math to center selected origin
        var moveOrigin = this.origins[x].get()[0] - 0.5;
        
        // Move front and center
        this.origins.forEach(function(origin, z){
            var yOrigin = z === x ? 0.5 : origin.get()[1],
                move = [origin.get()[0] - moveOrigin, yOrigin];
            
            origin.set(move, { duration: 800, curve: 'easeInOut' });
        });
        

        this.scales[x].set(0.5, trans);         //move Scale up 
            
        this.angles[x].set(         //Spin the page
            3.14, trans,
            function(){
                this.scales[x].set(1, trans);       //Finish the zoom in
                
                this.otherSideModifiers[x]          //Show content Surface
                    .transformFrom(Transform.translate(0,0,2));
                this.opacities[x].set(1, { duration: 1000, curve: 'easeIn' });
            }.bind(this)
        );

        this.currentPage = newPage;
    };
    
    PageView.prototype.zoomOut = function(x){
        var trans = { duration: 1000, curve: 'easeIn' };
        
        this.origins[x].set([this.origins[x].get()[0], this.options.yOffset]);
        this.otherSideModifiers[x]          //Show content Surface
            .transformFrom(Transform.translate(0,0,-1));
            
        this.opacities[x].set(0, {duration: 150, curve: 'easeIn'}, 
            function(){
            
            this.scales[x].set(0.2, trans);
            this.angles[x].set(this.options.defaultAngle, trans);
            
        }.bind(this));
        
        this.currentPage = null;
    };

    module.exports = PageView;
});
