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
        var canvas = $('<canvas style="position: fixed; z-index: 1001;top: 10px; right: 10px;transform: scale(-1, 1); opacity: 0.9">').get(0),
            context = canvas.getContext('2d'),
            video = document.createElement('video'),
            fist_pos_old,
            detector;
        document.getElementsByTagName('body')[0].appendChild(canvas);
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
                if ($("#myModal").css('display') == 'block') {
                    compatibility.requestAnimationFrame(rotateplay);
                } else {
                    compatibility.requestAnimationFrame(play);
                }

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
                        var ele = $("#mainImage")[0];
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
                                        flag = false;
                                    }
                                }, function () {
                                    if (flag) {
                                        $('.thumb.active').closest('div').prev('div').find('.thumb').click();
                                        $('body').addClass("swipe").removeClass("scroll");
                                        flag = false;
                                    }
                                }, function () {
                                    flag = true;
                                }, function () {
                                    $('body').addClass("scroll").removeClass("swipe");
                                });
                                if ($("body").hasClass("scroll")) {
                                    window.scrollBy(dx * 200, dy * 200);
                                }
                            }
                            if ($(elem).hasClass("swipe-carousel")) {
                                var carousel = $(elem).owlCarousel();
                                // var flag = true;
                                swiper(dx, dy, elem, function () {
                                    if (flag) {
                                        $("body").addClass("swipe").removeClass("scroll");
                                        carousel.trigger('owl.next');
                                        flag = false;
                                    }
                                }, function () {
                                    if (flag) {
                                        // $("body").find(".owl-prev").trigger("click");
                                        $("body").addClass("swipe").removeClass("scroll");
                                        carousel.trigger('owl.prev');
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
                                    window.scrollBy(dx * 200, dy * 200);
                                }
                            }
                        })
                        // console.log($("#mainImage")[0].getBoundingClientRect());
                    } else fist_pos_old = fist_pos;
                    /* Draw coordinates on video overlay: */
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
// document.getElementById('link').href = 'javascript:(' + autoplay.toString() + ')()';
autoplay();

function swipe(dx, dy, ele) {
    var dimensions = ele.getBoundingClientRect();
    if (dimensions.top >= 0 && dimensions.bottom >= 0) {
        if (dx < -0.15) {
            // console.log("next");
            if (flag) {
                $('.thumb.active').closest('div').next('div').find('.thumb').click();
                $('body').addClass("swipe").removeClass("scroll");
                flag = false;
            }
        }
        if (dx > 0.15) {
            // console.log("prev");
            if (flag) {
                $('.thumb.active').closest('div').prev('div').find('.thumb').click();
                $('body').addClass("swipe").removeClass("scroll");
                flag = false;
            }
        }
        if (dx == 0) {
            flag = true;
        }
        if ($('body').hasClass('swipe') && (dy > 0.2 || dy < -0.2)) {
            $('body').addClass("scroll").removeClass("swipe");
        }
    }
}

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

function rotateplay() {
            compatibility.requestAnimationFrame(rotateplay);
            if (video.paused) video.play();

            // Draw video overlay:
            canvas.width = ~~(100 * video.videoWidth / video.videoHeight);
            canvas.height = 100;
            context.drawImage(video, 0, 0, canvas.clientWidth, canvas.clientHeight);

            if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {

                // Prepare the detector once the video dimensions are known:
                if (!detector) {
                    var width = ~~(140 * video.videoWidth / video.videoHeight);
                    var height = 140;
                    detector = new objectdetect.detector(width, height, 1.1, objectdetect.handfist);
                }

                // Smooth rotation of the 3D object:
                angle = smoother.smooth(angle);
                document.getElementById('transform_a').setAttribute('rotation', '0 1 0 ' + angle[0]);
                document.getElementById('transform_b').setAttribute('rotation', '1 0 0 ' + angle[1]);

                // Perform the actual detection:
                var coords = detector.detect(video, 1);

                if (coords[0]) {
                    var coord = coords[0];

                    // Rescale coordinates from detector to video coordinate space:
                    coord[0] *= video.videoWidth / detector.canvas.width;
                    coord[1] *= video.videoHeight / detector.canvas.height;
                    coord[2] *= video.videoWidth / detector.canvas.width;
                    coord[3] *= video.videoHeight / detector.canvas.height;

                    var fist_pos = [coord[0] + coord[2] / 2, coord[1] + coord[3] / 2];

                    if (fist_pos_old) {
                        var dx = (fist_pos[0] - fist_pos_old[0]) / video.videoWidth,
                            dy = (fist_pos[1] - fist_pos_old[1]) / video.videoHeight;
                            console.log(dx);
                        if (dx*dx + dy*dy < 0.2) {
                            angle[0] += 5.0 * dx;
                            angle[1] += 5.0 * dy;
                        }
                        fist_pos_old = fist_pos;
                    } else if (coord[4] > 2) {
                        fist_pos_old = fist_pos;
                    }

                    // Draw coordinates on video overlay:
                    context.beginPath();
                    context.lineWidth = '2';
                    context.fillStyle = fist_pos_old ? 'rgba(0, 255, 255, 0.5)' : 'rgba(255, 0, 0, 0.5)';
                    context.fillRect(
                        coord[0] / video.videoWidth * canvas.clientWidth,
                        coord[1] / video.videoHeight * canvas.clientHeight,
                        coord[2] / video.videoWidth * canvas.clientWidth,
                        coord[3] / video.videoHeight * canvas.clientHeight);
                    context.stroke();
                } else fist_pos_old = null;
            }
        }
