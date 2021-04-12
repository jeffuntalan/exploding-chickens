/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/public/js/game/animation.min.js
Desc     : handles animations for drawing and playing cards
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

!function(t,n){"object"==typeof exports&&"undefined"!=typeof module?module.exports=n():"function"==typeof define&&define.amd?define(n):(t=t||self).AnimationFrames=n()}(this,function(){"use strict";var t=window.requestAnimationFrame||function(t){setTimeout(t,0)},n=function(){this.animations=[]};n.prototype.add=function(t){this.animations.push(t)},n.prototype.render=function(){for(var t=this.animations,n=Date.now(),e=0;e<t.length;e++){var i=t[e];if(!(n<i.start)){i.started||(i.started=!0,i.onstart&&i.onstart());var r=Math.min(1,(n-i.start)/(i.end-i.start)),o=i.ease(r);i.onprogress&&i.onprogress(o,r),n>=i.end&&(i.onend&&i.onend(),t.splice(e--,1))}}},n.prototype.remove=function(t){for(var n=this.animations,e=0;e<n.length;e++)n[e]===this&&n.splice(e--,1)};var e,i=new n,r=function(t){return function(n){return Math.pow(n,t)}},o=function(t){return function(n){return 1-Math.abs(Math.pow(n-1,t))}},u=function(t){return function(n){return n<.5?r(t)(2*n)/2:o(t)(2*n-1)/2+.5}},a={linear:function(t){return t},quadIn:r(2),quadOut:o(2),quadInOut:u(2),cubicIn:r(3),cubicOut:o(3),cubicInOut:u(3),quartIn:r(4),quartOut:o(4),quartInOut:u(4),quintIn:r(5),quintOut:o(5),quintInOut:u(5),sineIn:function(t){return 1+Math.sin(Math.PI/2*t-Math.PI/2)},sineOut:function(t){return Math.sin(Math.PI/2*t)},sineInOut:function(t){return(1+Math.sin(Math.PI*t-Math.PI/2))/2},bounce:function(t){var n=7.5625,e=2.75;return t<1/e?n*t*t:t<2/e?n*(t-=1.5/e)*t+.75:t<2.5/e?n*(t-=2.25/e)*t+.9375:n*(t-=2.625/e)*t+.984375}},s=function(n){void 0===n&&(n={});var r=n.delay;void 0===r&&(r=0);var o=n.duration;void 0===o&&(o=0);var u=n.easing;void 0===u&&(u="quadOut");var a=n.oninit,s=n.onstart,f=n.onprogress,c=n.onend;e||(e=t(d));var h=Date.now();if(this.initTime=h,this.delay=r,this.duration=o,this.easing=u,this.onstart=s,this.onprogress=f,this.onend=c,!this.ease)throw new Error("Easing not found");i.add(this),a&&a()},f={start:{configurable:!0},end:{configurable:!0},ease:{configurable:!0}};function d(){i.render(),e=t(d)}return f.start.get=function(){return this.initTime+this.delay},f.end.get=function(){return this.start+this.duration},f.ease.get=function(){return a[this.easing]},s.prototype.destroy=function(){i.remove(this)},s.from=function(t,n){return t*(1-n)},Object.defineProperties(s.prototype,f),s.ease=a,s});

// Name : frontend-game.anm_draw_card(data, recur)
// Desc : trigger the draw card animation
function anm_draw_card(data, recur) {
    const temp = document.getElementById("anim_draw");
    const target = document.getElementById(data._id);
    // Handle lag from data update
    if (target === null && recur === true) {
        setTimeout(function () { anm_draw_card(data, true) }, 100);
    } else if (target === null && recur === false) {
        return;
    }
    // Add new animation
    new AnimationFrames({
        duration: 400,
        easing: 'sineInOut',
        onstart () {
            temp.style.display = '';
            temp.style.backgroundImage = 'url(/' + data.image_loc + ')';
            target.style.visibility = 'hidden';
        },
        onprogress: (e) => {
            temp.style.transform = translate(e * (get_position(target).x - get_position(temp).x), e * (get_position(target).y - get_position(temp).y));
        },
        onend () {
            temp.style.transform = '';
            target.style.visibility = 'visible';
        }
    });
}

// Name : frontend-game.anm_play_card(data)
// Desc : trigger the play card animation
function anm_play_card(data) {
    const temp = document.getElementById("anim_draw");
    const target = document.getElementById(data.card._id);
    const discard = document.getElementById("anim_discard");
    new AnimationFrames({
        duration: 400,
        easing: 'sineInOut',
        onstart () {
            temp.style.display = '';
            temp.style.backgroundImage = 'url(/' + data.card.image_loc + ')';
            target.style.visibility = 'hidden';
        },
        onprogress: (e) => {
            temp.style.transform = translate((e * ((get_position(discard).x - get_position(target).x)) +  + (get_position(target).x - get_position(temp).x)), (e * (get_position(discard).y - get_position(target).y)) + (get_position(target).y - get_position(temp).y));
        },
        onend () {
            itr_update_discard(data.game_details);
            itr_update_hand(data.game_details);
            temp.style.transform = '';
        }
    });
}

// HELPER FUNCTIONS

const translate = (x, y) => {
    return `translate(${x}px, ${y}px)`;
}

function get_position(el) {
    let xPos = 0;
    let yPos = 0;
    while (el) {
        if (el.tagName === "BODY") {
            var xScroll = el.scrollLeft || document.documentElement.scrollLeft;
            var yScroll = el.scrollTop || document.documentElement.scrollTop;
            xPos += (el.offsetLeft - xScroll + el.clientLeft);
            yPos += (el.offsetTop - yScroll + el.clientTop);
        } else {
            xPos += (el.offsetLeft - el.scrollLeft + el.clientLeft);
            yPos += (el.offsetTop - el.scrollTop + el.clientTop);
        }
        el = el.offsetParent;
    }
    return {
        x: xPos,
        y: yPos
    };
}