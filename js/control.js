var autoplay = function () {
    function getScripts(urls, callback) {
        var numDone = 0;

        function getScript(url, callback) {
            var script = document.createElement('script'),
                head = document.getElementsByTagName('head')[0],
                done = false;
            script.src = url;
            script.onload = script.onreadystatechange = function () {
                if (!done && (!this.readyState || this.readyState == 'loaded' || this.readyState == 'complete')) {
                    done = true;
                    callback();
                    script.onload = script.onreadystatechange = null;
                    head.removeChild(script);
                }
            };
            head.appendChild(script);
        }

        function getScriptCallback() {
            if (urls.length > 0) getScript(urls.shift(), getScriptCallback);
            else callback();
        }
        getScript(urls.shift(), getScriptCallback);
    }
    getScripts(['/js/compatibility.js', '/js/objectdetect.js', '/js/objectdetect.handfist.js'], function () {
        var canvas = $('<canvas style="position: fixed; z-index: 2001;top: 10px; right: 32px;transform: scale(-1, 1); opacity: 0.8">').get(0),
            context = canvas.getContext('2d'),
            video = document.createElement('video'),
            fist_pos_old,
            angle = [],
            smoother,
            detector;
        if ($(".3d").length > 0) {
           angle = [0, 0];
            smoother = new Smoother([0.9995, 0.9995], [0, 0], 0);
        }
        document.getElementsByTagName('body')[0].appendChild(canvas);
        var gestureHtml = '<div id="gestureDiv"><img class="img-responsive" src="/img/right.gif"></div>';
        $('body')[0].appendChild($(gestureHtml).get(0));
        $("#gestureDiv").hide();
        try {
            compatibility.getUserMedia({
                video: true
            }, function (stream) {
                try {
                    video.src = compatibility.URL.createObjectURL(stream);
                } catch (error) {
                    video.src = stream;
                }
                console.log($("#myModal").css('display'));
                compatibility.requestAnimationFrame(play);
            }, function (error) {
                alert("WebRTC not available");
            });
        } catch (error) {
            alert(error);
        }

        function play() {
            compatibility.requestAnimationFrame(play);
            if (video.paused) video.play();
            if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
                /* Prepare the detector once the video dimensions are known: */
                if (!detector) {
                    var width = ~~(80 * video.videoWidth / video.videoHeight);
                    var height = 80;
                    detector = new objectdetect.detector(width, height, 1.1, objectdetect.handfist);
                }
                if ($(".3d").length > 0) {
                angle = smoother.smooth(angle);

                    document.getElementById('transform_a').setAttribute('rotation', '0 1 0 ' + angle[0]);
                    document.getElementById('transform_b').setAttribute('rotation', '1 0 0 ' + angle[1]);
                }
                /* Draw video overlay: */
                canvas.width = ~~(100 * video.videoWidth / video.videoHeight);
                canvas.height = 100;
                context.drawImage(video, 0, 0, canvas.clientWidth, canvas.clientHeight);
                var coords = detector.detect(video, 1);
                if (coords[0]) {
                    var coord = coords[0];
                    /* Rescale coordinates from detector to video coordinate space: */
                    coord[0] *= video.videoWidth / detector.canvas.width;
                    coord[1] *= video.videoHeight / detector.canvas.height;
                    coord[2] *= video.videoWidth / detector.canvas.width;
                    coord[3] *= video.videoHeight / detector.canvas.height;
                    /* Find coordinates with maximum confidence: */
                    var coord = coords[0];
                    for (var i = coords.length - 1; i >= 0; --i)
                        if (coords[i][4] > coord[4]) coord = coords[i];
                    /* Scroll window: */
                    var fist_pos = [coord[0] + coord[2] / 2, coord[1] + coord[3] / 2];
                    if (fist_pos_old) {
                        var dx = (fist_pos[0] - fist_pos_old[0]) / video.videoWidth,
                            dy = (fist_pos[1] - fist_pos_old[1]) / video.videoHeight;
                        if (dx * dx + dy * dy < 0.2) {
                            angle[0] += 0.4 * dx;
                            angle[1] += 0.4 * dy;
                        }
                        var swiperElem = $(".swiper");
                        $.each(swiperElem, function (key, elem) {
                            // console.log(elem);
                            // console.log($(elem).hasClass("swipe-product"));
                            if ($(elem).hasClass("swipe-product")) {
                                // swipe(dx, dy, ele);
                                swiper(dx, dy, elem, function () {
                                    if (flag) {
                                        $('.thumb.active').closest('div').next('div').find('.thumb').click();
                                        $('body').addClass("swipe").removeClass("scroll");
                                        showGesture("next");
                                        flag = false;
                                    }
                                }, function () {
                                    if (flag) {
                                        $('.thumb.active').closest('div').prev('div').find('.thumb').click();
                                        $('body').addClass("swipe").removeClass("scroll");
                                        showGesture("prev");
                                        flag = false;
                                    }
                                }, function () {
                                    flag = true;
                                }, function () {
                                    $('body').addClass("scroll").removeClass("swipe");
                                });
                                if ($("body").hasClass("scroll")) {
                                    scroll(dx, dy);
                                }
                            }
                            if ($(elem).hasClass("swipe-carousel")) {
                                var carousel = $(elem).owlCarousel();
                                // var flag = true;
                                swiper(dx, dy, elem, function () {
                                    if (flag) {
                                        $("body").addClass("swipe").removeClass("scroll");
                                        carousel.trigger('owl.next');
                                        showGesture("next");
                                        flag = false;
                                    }
                                }, function () {
                                    if (flag) {
                                        // $("body").find(".owl-prev").trigger("click");
                                        $("body").addClass("swipe").removeClass("scroll");
                                        carousel.trigger('owl.prev');
                                        showGesture("prev");
                                        flag = false;
                                    }
                                }, function () {
                                    flag = true;
                                }, function () {
                                    $("body").addClass("scroll").removeClass("swipe");
                                    dy = 0.02;
                                    if (dy < 0) {
                                        dy = -0.02;
                                    }
                                });
                                if ($("body").hasClass("scroll")) {
                                    scroll(dx, dy);
                                }
                            }
                        })
                        if (swiperElem.length === 0) {
                            // console.log('test');
                            scroll(dx, dy);
                        }
                    } else fist_pos_old = fist_pos;
                    context.beginPath();
                    context.lineWidth = '2';
                    context.fillStyle = 'rgba(0, 255, 255, 0.5)';
                    context.fillRect(coord[0] / video.videoWidth * canvas.clientWidth, coord[1] / video.videoHeight * canvas.clientHeight, coord[2] / video.videoWidth * canvas.clientWidth, coord[3] / video.videoHeight * canvas.clientHeight);
                    context.stroke();
                } else fist_pos_old = null;
            }
        }
    });
};
autoplay();

function swiper(dx, dy, ele, next, prev, stay, prevent) {
    if (isVisible(ele)) {
        if (dx < -0.15) {
            next();
            // console.log("next");
        }
        if (dx > 0.15) {
            prev();
            // console.log("prev");
        }
        if (dx == 0) {
            stay();
        }
        if ($('body').hasClass('swipe') && (dy > 0.2 || dy < -0.2)) {
            prevent();
        }
    }
}

function isVisible(ele) {
    var coords = ele.getBoundingClientRect();
    if (coords.top >= -50 && coords.bottom >= -50) {
        return true;
    }
    return false;
}

function scroll(dx, dy) {
    if (!$("body").hasClass("disable-scroll")) {
        window.scrollBy(dx * 200, dy * 200);
    }
}

function showGesture(gesture) {
    console.log(gesture);
    if (gesture === "prev") {
        $("#gestureDiv img").css("transform", "rotate(180deg)");
    } else {
        $("#gestureDiv img").css("transform", "rotate(0deg)");
    }
    $("#gestureDiv").fadeToggle();
    setTimeout(function () {
        $("#gestureDiv").fadeToggle("slow");
    }, 200);
}
