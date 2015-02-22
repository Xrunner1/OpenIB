/* This file is dedicated to the public domain; you may do as you wish with it. */
/* Note: This code expects the global variable configRoot to be set. */

if (typeof _ == 'undefined') {
  var _ = function(a) { return a; };
}

function setupVideo(thumb, url) {
    if (thumb.videoAlreadySetUp) return;
    thumb.videoAlreadySetUp = true;

    var video = null;
    var videoContainer, videoHide;
    var expanded = false;
    var hovering = false;
    var loop = setting("videoloop");
    var loopControls = [document.createElement("span"), document.createElement("span")];
    var fileInfo = thumb.parentNode.querySelector(".fileinfo");
    var mouseDown = false;

    function unexpand() {
        if (expanded) {
            expanded = false;
	    hovering = false;
            if (video.pause) video.pause();
            videoContainer.style.display = "none";
            thumb.style.display = "inline";
            video.style.maxWidth = "inherit";
            video.style.maxHeight = "inherit";
        }
    }

    function unhover() {
        if (hovering) {
            hovering = false;
            if (video.pause) video.pause();
            videoContainer.style.display = "none";
	    video.style.display = "none";
        }
    }

    // Create video element if does not exist yet
    function getVideo() {
        if (video == null) {
            video = document.createElement("video");
            video.src = url;
            video.loop = loop;
            video.innerText = _("Your browser does not support HTML5 video.");

            videoHide = document.createElement("img");
            videoHide.src = configRoot + "static/collapse.gif";
            videoHide.alt = "[ - ]";
            videoHide.title = "Collapse video";
            videoHide.style.marginLeft = "-15px";
            videoHide.style.cssFloat = "left";
            videoHide.addEventListener("click", unexpand, false);

            videoContainer = document.createElement("div");
	    videoContainer.id = "#expandedVideo";
            videoContainer.style.paddingLeft = "15px";
            videoContainer.style.display = "none";
            videoContainer.appendChild(videoHide);
            videoContainer.appendChild(video);
            thumb.parentNode.insertBefore(videoContainer, thumb.nextSibling);

            // Dragging to the left collapses the video
            video.addEventListener("mousedown", function(e) {
                if (e.button == 0) mouseDown = true;
            }, false);
            video.addEventListener("mouseup", function(e) {
                if (e.button == 0) mouseDown = false;
            }, false);
            video.addEventListener("mouseenter", function(e) {
                mouseDown = false;
            }, false);
            video.addEventListener("mouseout", function(e) {
                if (mouseDown && e.clientX - video.getBoundingClientRect().left <= 0) {
                    unexpand();
                }
                mouseDown = false;
            }, false);
        }
    }

    // Clicking on thumbnail expands video
    thumb.addEventListener("click", function(e) {
        if (setting("videoexpand") && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
            getVideo();
            expanded = true;
            hovering = false;

            video.style.position = "static";
            video.style.pointerEvents = "inherit";
            video.style.display = "inline";
            videoHide.style.display = "inline";
            videoContainer.style.display = "block";
            videoContainer.style.position = "static";
            video.parentNode.parentNode.removeAttribute('style');
            thumb.style.display = "none";

            video.muted = (setting("videovolume") == 0);
            video.volume = setting("videovolume");
            video.controls = true;
            if (video.readyState == 0) {
                video.addEventListener("loadedmetadata", expand2, false);
            } else {
                setTimeout(expand2, 0);
            }
            video.play();
            e.preventDefault();
        }
    }, false);

    function expand2() {
        video.style.maxWidth = "100%";
        video.style.maxHeight = window.innerHeight + "px";

        var bottom = video.getBoundingClientRect().bottom;
        if (bottom > window.innerHeight) {
            window.scrollBy(0, bottom - window.innerHeight);
        }
        // work around Firefox volume control bug
        video.volume = Math.max(setting("videovolume") - 0.001, 0);
        video.volume = setting("videovolume");
    }

    // Hovering over thumbnail displays video
    thumb.addEventListener("mouseover", function(e) {
	if (setting("videohover")) {
	    getVideo();
	    expanded = false;
	    hovering = true;
	    
	    var vidName = video.src.split('/').pop().split(".").shift();
	    var isMod = (window.location.pathname.split("/")[1]=="mod.php");
	    var thisBoard = isMod?window.location.href.split("/")[4]:window.location.pathname.split("/")[1];    
	    var pageType = window.active_page;
	    var pageURL = isMod?window.location.href:window.location.pathname;
	    var jsonURL;
	    var thisThread;
	    var thisPost;
        console.log("vidName = "+vidName);
	    
	    if (pageType==="thread") {
		jsonURL = pageURL.replace(/\.html$/, ".json");
	    } else
	    if (pageType==="index"){
		var thisPage = isMod?window.location.href.split("/")[5].split(".")[0]:window.location.pathname.split("/")[2].split(".")[0];
		if (thisPage=="index") { thisPage="0"; } else { thisPage-=1;}
		jsonURL = pageURL.replace(/[a-z0-9]+.html$/, thisPage+".json");
	    }

	    $.getJSON(jsonURL, function (thread) {
		$this = thread;
		if(typeof thread.threads != "undefined" && thread.threads != null && thread.threads.length > 0){

		    var vidX = e.clientX;
		    var vidY = e.clientY;
		    var windowWidth = $(window).width();
		    var windowHeight = $(window).height();
		    var vidWidth = windowWidth - vidX;
		    var vidHeight = windowHeight - vidY;
		    var vidAspect = vidHeight / vidWidth;

		    var totalWidth = windowWidth - vidX;
		    var totalHeight = totalWidth*vidAspect;
		    var maxWidth = totalWidth - 20;
		    if (maxWidth < 250) { maxWidth = 250; }
		    var maxHeight = maxWidth * vidAspect;
		    var vidTop = vidY;
		    var vidBottom;
		    var vidRight;

		    if (vidWidth > windowWidth) {
			video.style.maxWidth = maxWidth+"px";
			video.style.maxHeight = maxHeight+"px";
			vidBottom = vidTop + maxHeight;
			vidRight = vidX+maxWidth - 20;
		    } else {
			video.style.maxWidth = vidWidth+"px";
			video.style.maxHeight = vidHeight+"px";
			vidBottom = vidTop + vidHeight;
			vidRight = vidX+vidWidth - 20;
		    }

		    if (vidBottom > windowHeight) { vidTop -= vidBottom-windowHeight; }
		    videoContainer.style.position = "fixed";
		    videoContainer.style.display = "block";
		    videoHide.style.display = "none";
		    if (vidRight > windowWidth) { 
			video.style.left = vidX-(vidRight-windowWidth)+"px";
		    } 
		    else { 
			video.style.left = vidX+"px";
		    }
		    video.style.top = vidTop+"px";
		    video.style.pointerEvents = "none";
		    video.style.display = "block";
		    video.style.position = "fixed";
		    video.muted = (setting("videovolume") == 0);
		    video.volume = setting("videovolume");
		    video.controls = false;
		    video.play();
		}
		else {

		    $.each($this.posts, function(){
			var tim = this.tim;
			var fileNum = vidName.split('-').pop();
			if(typeof this.extra_files != "undefined" && this.extra_files != null && this.extra_files.length > 0){
			    $.each(this.extra_files, function() {
				if (vidName==this.tim){
				    tim = this.tim;
				}
			    });
			}
			if (vidName==tim) { 
			    var vidX = e.clientX;
			    var vidY = e.clientY;
			    var vidWidth = this.w;
			    var vidHeight = this.h;
			    var vidAspect = vidHeight / vidWidth;
			    var windowWidth = $(window).width();
			    var windowHeight = $(window).height();
			    var totalWidth = windowWidth - vidX;
			    var totalHeight = totalWidth*vidAspect;
			    var maxWidth = totalWidth - 20;
			    if (maxWidth < 250) { maxWidth = 250; }
			    var maxHeight = maxWidth * vidAspect;
			    var vidTop = vidY;
			    var vidBottom;
			    var vidRight;
			    if (vidWidth > windowWidth) {
				video.style.maxWidth = maxWidth+"px";
				video.style.maxHeight = maxHeight+"px";
				vidBottom = vidTop + maxHeight;
				vidRight = maxWidth+vidX;
			    } else {
				video.style.maxWidth = vidWidth+"px";
				video.style.maxHeight = vidHeight+"px";
				vidBottom = vidTop + vidHeight;
				vidRight = vidWidth+vidX;
			    }
			    if (vidBottom > windowHeight) {
				vidTop -= vidBottom-windowHeight;
			    }

			    videoContainer.style.position = "fixed";
			    videoContainer.style.display = "block";
			
			    videoHide.style.display = "none";
			
			    if (vidRight > windowWidth) { 
				video.style.left = vidX-(vidRight-windowWidth)+"px";
			    } 
			    else { 
				video.style.left = vidX+"px";
			    }
			    video.style.top = vidTop+"px";
			    video.style.pointerEvents = "none";
			    video.style.display = "block";
			    video.style.position = "fixed";
			    video.muted = (setting("videovolume") == 0);
			    video.volume = setting("videovolume");
			    video.controls = false;
			    video.play();
			}
		    });  
		} //else*/
	    });
        }
    }, false);

    thumb.addEventListener("mouseout", unhover, false);

    // Scroll wheel on thumbnail adjusts default volume
    thumb.addEventListener("wheel", function(e) {
        if (setting("videohover")) {
            var volume = setting("videovolume");
            if (e.deltaY > 0) volume -= 0.1;
            if (e.deltaY < 0) volume += 0.1;
            if (volume < 0) volume = 0;
            if (volume > 1) volume = 1;
            if (video != null) {
                video.muted = (volume == 0);
                video.volume = volume;
            }
            changeSetting("videovolume", volume);
            e.preventDefault();
        }
    }, false);

    // [play once] vs [loop] controls
    function setupLoopControl(i) {
        loopControls[i].addEventListener("click", function(e) {
            loop = (i != 0);
            thumb.href = thumb.href.replace(/([\?&])loop=\d+/, "$1loop=" + i);
            if (video != null) {
                video.loop = loop;
                if (loop && video.currentTime >= video.duration) {
                    video.currentTime = 0;
                }
            }
            loopControls[i].style.fontWeight = "bold";
            loopControls[1-i].style.fontWeight = "inherit";
        }, false);
    }

    loopControls[0].textContent = _("[play once]");
    loopControls[1].textContent = _("[loop]");
    loopControls[(setting("videoloop") ? 1 : 0)].style.fontWeight = "bold";
    for (var i = 0; i < 2; i++) {
        setupLoopControl(i);
        loopControls[i].style.whiteSpace = "nowrap";
        fileInfo.appendChild(document.createTextNode(" "));
        fileInfo.appendChild(loopControls[i]);
    }
}

function setupVideosIn(element) {
    var thumbs = element.querySelectorAll("a.file");
    for (var i = 0; i < thumbs.length; i++) {
        if (/(\.webm)|(\.mp4)$/.test(thumbs[i].pathname)) {
            setupVideo(thumbs[i], thumbs[i].href);
        } else {
            var m = thumbs[i].search.match(/\bv=([^&]*)/);
            if (m != null) {
                var url = decodeURIComponent(m[1]);
                if (/(\.webm)|(\.mp4)$/.test(url)) setupVideo(thumbs[i], url);
            }
        }
    }
}

onready(function(){
    // Insert menu from settings.js
    if (typeof settingsMenu != "undefined" && typeof Options == "undefined")
      document.body.insertBefore(settingsMenu, document.getElementsByTagName("hr")[0]);

    // Setup Javascript events for videos in document now
    setupVideosIn(document);

    // Setup Javascript events for videos added by updater
    if (window.MutationObserver) {
        var observer = new MutationObserver(function(mutations) {
            for (var i = 0; i < mutations.length; i++) {
                var additions = mutations[i].addedNodes;
                if (additions == null) continue;
                for (var j = 0; j < additions.length; j++) {
                    var node = additions[j];
                    if (node.nodeType == 1) {
                        setupVideosIn(node);
                    }
                }
            }
        });
        observer.observe(document.body, {childList: true, subtree: true});
    }
});
