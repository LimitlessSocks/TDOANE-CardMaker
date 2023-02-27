(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["react", "react-dom", "create-react-class"], factory);
    } else {
        factory(React, ReactDOM, createReactClass);
    }
}(this, function (React, ReactDOM, ReactClass) {
/**
 * @license almond 0.3.3 Copyright jQuery Foundation and other contributors.
 * Released under MIT license, http://github.com/requirejs/almond/LICENSE
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part, normalizedBaseParts,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name) {
            name = name.split('/');
            lastIndex = name.length - 1;

            // If wanting node ID compatibility, strip .js from end
            // of IDs. Have to do this here, and not in nameToUrl
            // because node allows either .js or non .js to map
            // to same file.
            if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
            }

            // Starts with a '.' so need the baseName
            if (name[0].charAt(0) === '.' && baseParts) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that 'directory' and not name of the baseName's
                //module. For instance, baseName of 'one/two/three', maps to
                //'one/two/three.js', but we want the directory, 'one/two' for
                //this normalization.
                normalizedBaseParts = baseParts.slice(0, baseParts.length - 1);
                name = normalizedBaseParts.concat(name);
            }

            //start trimDots
            for (i = 0; i < name.length; i++) {
                part = name[i];
                if (part === '.') {
                    name.splice(i, 1);
                    i -= 1;
                } else if (part === '..') {
                    // If at the start, or previous value is still ..,
                    // keep them so that when converted to a path it may
                    // still work when converted to a path, even though
                    // as an ID it is less than ideal. In larger point
                    // releases, may be better to just kick out an error.
                    if (i === 0 || (i === 1 && name[2] === '..') || name[i - 1] === '..') {
                        continue;
                    } else if (i > 0) {
                        name.splice(i - 1, 2);
                        i -= 2;
                    }
                }
            }
            //end trimDots

            name = name.join('/');
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            var args = aps.call(arguments, 0);

            //If first arg is not require('string'), and there is only
            //one arg, it is the array form without a callback. Insert
            //a null so that the following concat is correct.
            if (typeof args[0] !== 'string' && args.length === 1) {
                args.push(null);
            }
            return req.apply(undef, args.concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    //Creates a parts array for a relName where first part is plugin ID,
    //second part is resource ID. Assumes relName has already been normalized.
    function makeRelParts(relName) {
        return relName ? splitPrefix(relName) : [];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relParts) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0],
            relResourceName = relParts[1];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relResourceName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relResourceName));
            } else {
                name = normalize(name, relResourceName);
            }
        } else {
            name = normalize(name, relResourceName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i, relParts,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;
        relParts = makeRelParts(relName);

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relParts);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, makeRelParts(callback)).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {
        if (typeof name !== 'string') {
            throw new Error('See almond README: incorrect module build, no module name');
        }

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("../lib/almond/almond", function(){});

define('draw/Group',["react", "react-class"], function Group(React, ReactClass)
{
	/**
	 * Container for various "draw/*" components.
	 *
	 * This component makes sure its descendants have a canvas available to them,
	 * and provides a method to them which they can use for updating the hierarchy.
	 * This due to sorting order.
	 */
	var Group = ReactClass({
		
		render: function render()
		{
			// Provide the over-arching canvas to all descendants of this element.
			var children = this.props.children;
			var canvas = this.props.canvas;
			var repaint = this.props.repaint || this.repaint;
			
			children = React.Children.map(children, function(child)
			{
					return React.cloneElement(child, { canvas: canvas, repaint: repaint });
			});
			
			// Create the group.
			return React.createElement("div", {style: {position: "relative"}}, children);
		},
		
		componentWillUpdate: function()
		{
			if (this.props.repaint !== "function")
			{
				this.r = true;
				var canvas = this.props.canvas;
				if (canvas !== null)
				{
					var ctx = canvas.getContext("2d");
					ctx.fillStyle = "#fff";
					ctx.fillRect(0,0,canvas.width, canvas.height);
					//ctx.clearRect(0,0,canvas.width, canvas.height);
				}
			}
		},
		
		/**
		 * Indicates that the hierarchy should be redrawn.
		 *
		 * This function is passed down to the children, so they can indicate the
		 * hierarchy should be redrawn. Letting only the relevant child redraw 
		 * itself might cause issues with sorting order.
		 */
		repaint: function repaint()
		{
			// Determine whether this group is in the top of the hierarchy.
			if (typeof this.props.repaint !== "function")
			{
				// If it is, no further propagation is needed.
				this.forceUpdate();
			}
			else
			{
				this.props.repaint();
			}
		}
	});
	Group.displayName = "Group";
	Group.defaultProps = {
		
	};
	return Group;
});

define('draw/Canvas',["react", "react-class", "./Group"], function Canvas(React, ReactClass, Group)
{
	/**
	 * Top-level container for other "draw/*" components.
	 *
	 * This element provides the canvas on which is descendants will draw.
	 */
	return ReactClass({

		getInitialState: function initialState()
		{
			// Canvas will be created upon first render of this component.
			return { canvas: null };
		},

		render: function render()
		{
			return React.createElement(
				"canvas",
				{
					onClick: this.save.bind(this),
					className: this.props.className,
					width: this.props.width,
					height: this.props.height,
					ref: function(canvas){ this.canvas = canvas; }.bind(this)
				},
				React.createElement(Group, { canvas: this.state.canvas }, this.props.children)
			);
		},

		save: function save()
		{
			var data = "";
			if (this.state.canvas !== null)
			{
				data = this.state.canvas.toDataURL();
			}
			var link = document.createElement("a");
			link.setAttribute("href", data);
			link.setAttribute("download", "Image.png");
			if (document.createEvent)
			{
				var evt = document.createEvent("MouseEvent");
				evt.initEvent("click", true, true);
				link.dispatchEvent(evt);
			}
			else
			{
				link.click();
			}
		},

		componentDidMount: function didMount()
		{
			// Make the canvas part of this element's state.
			var canvas = this.canvas;
			delete this.canvas;

			// Force a redraw now that the canvas is available.
			this.setState({ canvas: canvas });
		}
	});
});

define('tcg/ygo/layout/Kind.js',["react", "react-class"], function Kind(React, ReactClass) {
    return {
        Anime:      Symbol("Kind.Anime"),
        Rush:       Symbol("Kind.Rush"),
        Monster:    Symbol("Kind.Monster"),
        Link:       Symbol("Kind.Link"),
        Backrow:    Symbol("Kind.Backrow"),
        Skill:      Symbol("Kind.Skill"),
    };
});

define('draw/Text',["react", "react-class"], function Text(React, ReactClass)
{
	/**
	 * Draws styled text on a DOM canvas.
	 */
	var Text = ReactClass({

		render: function render()
		{
			return React.createElement(
				 // Use an element without semantic value.
				"div",
				{
					// Apply any of the provided styles to the element.
					style: this.props.style
				},
				this.props.text
			)
		},

		componentDidMount: function didMount()
		{
			this.draw();
		},

		// Canvas won't be available on the first cycle anyway, so use "update".
		componentDidUpdate: function didUpdate()
		{
			this.draw();
		},

		draw: function render()
		{
			var canvas = this.props.canvas;
			// Make sure the image has downloaded.
			if (canvas !== null)
			{
				var ctx = canvas.getContext("2d");

				// this.props cannot be modified by default. Make a deep copy that loses
				// any read-only traits.
				var style = JSON.parse(JSON.stringify(this.props.style));

				ctx.save();
				ctx.fillStyle = style.color || "black";
				var paragraphs;
				do
				{
					this.setFont(ctx, style);
					paragraphs = this.createParagraphs(ctx, this.props.text, style.width);

					// Calculate the height of the text, as it is needed for determining
					// whether the text should shrink or not.
					var height = style.fontSize * paragraphs.reduce(function(accumulator, current)
					{
						return accumulator + current.length;
					}, 0);
					// If no height is provided, there is no need to shrink the text.
					// The same applies if the text would fit naturally.
					if (style.height === undefined || height < style.height)
					{
						break;
					}
					// Lower the font size and try again, until it makes no sens to go on.
					style.fontSize -= 0.25;
					// style.fontSize -= 0.1;
					// style.fontSize -= 1;
				} while(style.fontSize > 0);

                // style.fontSize = Math.floor(style.fontSize);
                // console.log(paragraphs, style);
				this.drawText(ctx, paragraphs, style.fontSize);
				ctx.restore();
			}
		},


		createParagraphs: function createParagraphs(ctx, text, availableWidth)
		{
			// Each linebreak indicates a new paragraph as far as this element is
			// concerned. This does not match its DOM behaviour.
			return text.split("\n").map(function(paragraph)
			{
				switch (this.props.style.whitespace) {
					case "nowrap": return [paragraph];
					default:       return this.wrapParagraph(ctx, paragraph, availableWidth);
				}

			}, this);
		},

		wrapParagraph: function wrapParagraph(ctx, paragraph, availableWidth)
		{
			// Use spaces as separator for words, and remove double spaces, as they
			// wouldn't show up in the DOM either.
			var words = paragraph.split(" ").filter(function(word){return word.length > 0;});
			var lines = [];

			var spaceWidth = ctx.measureText(" ").width;
			var line = { width: -spaceWidth, words: []};

			for (var i=0; i<words.length; ++i)
			{
				var word = words[i];
				var wordWidth = ctx.measureText(word).width;

				if ((line.width + wordWidth + spaceWidth) < availableWidth)
				{
					line.width += wordWidth + spaceWidth;
					line.words[line.words.length] = word;
				}
				else
				{
					// Avoid empty lines as a result of very long words.
					if (line.words.length > 0)
					{
						lines[lines.length] = line.words.join(" ");
					}
					line = { width: wordWidth, words: [word] };
				}
			}
			lines[lines.length] = line.words.join(" ");
			return lines;
		},

		/**
		 * Draws a block of text based on the style applied to this text.
		 *
		 * @param {CanvasRenderingContext2D} ctx Context used for drawing.
		 * @param {String} text Text to draw.
		 */
		drawText: function drawText(ctx, paragraphs, lineHeight)
		{
			ctx.save();
			ctx.translate(this.props.style.left, this.props.style.top);
			for (var i=0; i<paragraphs.length; ++i)
			{
				var lines = paragraphs[i];
				for (var currentline=0; currentline<lines.length; ++currentline)
				{
					var line = lines[currentline];
					// Account for the new line. By default the text is drawn at the
					// baseline, which is one line higher than one might expect; that
					// issue is also solved by moving one line down.
					ctx.translate(0, lineHeight);
					// Determine which alignment strategy to use, given a DOM canvas
					//doesn't provide all of them, and some have side effects.
					switch(this.props.style.textAlign)
					{
						default:        this.drawTextDefaultAligned(ctx, line);  break;
						case "left":    this.drawTextLeftAligned(ctx, line);     break;
						case "right":   this.drawTextRightAligned(ctx, line);    break;
						case "center":  this.drawTextCentered(ctx, line);        break;
						case "justify":
						{
							// The last line of justified text is typically aligned according
							// to the default alignment. Account for that by using a different
							// renderer for the last line of the paragraph.
							if (currentline !== (lines.length -1)) {
								this.drawTextJustified(ctx, line);
							} else {
								this.drawTextDefaultAligned(ctx, line)
							}
							break;
						}
					}
				}
			}
			ctx.restore();
		},

		drawTextDefaultAligned: function defaultAligned(ctx, text)
		{
			// TODO: Account for text direction styles (rtl, ltr).
			this.drawTextLeftAligned(ctx, text);
		},

        renderText: function renderText(ctx, text, x, y) {
            // console.log("RENDERTEXT", this.props);
            if(this.props.style.strokeWidth) {
                ctx.strokeStyle = this.props.style.strokeColor;
                ctx.lineWidth = this.props.style.strokeWidth;
                ctx.strokeText(text, x, y);
            }
            ctx.fillText(text, x, y);
        },

        /**
         * Draws a single line of text that hugs the left egde.
         *
         * @param {CanvasRenderingContext2D} ctx Context used for drawing.
         * @param {String} text Text to draw.var style = this.props.style;
         */
        drawTextLeftAligned: function leftAligned(ctx, text)
        {
        	var textWidth = ctx.measureText(text).width;
        	var availableWidth = this.props.style.width || 0;

        	var scale = Math.min(availableWidth / Math.max(textWidth, 1), 1);
        	ctx.save();
        	ctx.scale(scale, 1);

        	this.renderText(ctx, text, 0, 0);
        	ctx.restore();
        },

		/**
		 * Draws a single line of text that hugs the right egde.
		 *
		 * @param {CanvasRenderingContext2D} ctx Context used for drawing.
		 * @param {String} text Text to draw.
		 */
		drawTextRightAligned: function rightAligned(ctx, text)
		{
			var textWidth = ctx.measureText(text).width;
			var availableWidth = this.props.style.width || 0;

			var scale = Math.min(availableWidth / Math.max(textWidth, 1), 1);

			ctx.save();
			ctx.translate((availableWidth - (textWidth * scale)), 0);
			ctx.scale(scale, 1);

			this.renderText(ctx, text, 0, 0);
			ctx.restore();
		},

		/**
		 * Draws a single line of text that hugs neither edge.
		 *
		 * @param {CanvasRenderingContext2D} ctx Context used for drawing.
		 * @param {String} text Text to draw.
		 */
		drawTextCentered: function centerAligned(ctx, text)
		{
			var textWidth = ctx.measureText(text).width;
			var availableWidth = this.props.style.width || 0;

			var scale = Math.min(availableWidth / Math.max(textWidth, 1), 1);

			ctx.save();
			ctx.translate((availableWidth / 2) - ((textWidth * scale) / 2), 0);
			ctx.scale(scale, 1);

			this.renderText(ctx, text, 0, 0);
			ctx.restore();
		},

		/**
		 * Draws a single line of text that hugs the left and right egde.
		 *
		 * @param {CanvasRenderingContext2D} ctx Context used for drawing.
		 * @param {String} text Text to draw.
		 */
		drawTextJustified: function justifyAligned(ctx, text)
		{
			// The words get additional spacing.
			var words = text.split(" ");
			var spaceWidth = ctx.measureText(" ").width;
			// Amount of leftover space that is added between each two words.
			var flexible = (this.props.style.width - ctx.measureText(text).width)
			             / (Math.max(1, words.length-1));

			// Update the position of the cursor.
			var xOffset = 0;

			for (var i=0; i<words.length; ++i)
			{
				this.renderText(ctx, words[i], xOffset, 0);
				xOffset += ctx.measureText(words[i]).width + spaceWidth + flexible;
			}
		},

		setFont: function setFont(ctx, style)
		{
			// This function should only be called internally,
			// hence no sanity checks.
			//var style = this.props.style;
			var font;
			ctx.font = font = [
				style.fontStyle, // "normal", "italic" or "oblique".
				style.fontVariant,
				style.fontWeight, // "thin", "normal", "bold". Can also be a number.
				style.fontSize + "px", // Size of the text in pixels.
				style.fontFamily // Array in the order of which font should be tried.
			].join(" ");
		}

	});

	Text.displayName = "Text";
	Text.defaultProps = {
		// Avoid sanity checks by providing a pure function.
		repaint: function repaint(){ /* Empty function which does nothing. */ },
		canvas: null, // Canvas on which this element should draw.
		text: "", // Default to an empty string.
		width: undefined, // Text can go on indefinitly on the same line.
		style: {
			color: "black",
			fontFamily: [ "serif" ], // Font to use if not specified.
			fontVariant: "normal", // Could be small caps.
			fontSize: 14, // Default font height (in pixels).
			fontStyle: "normal", // Normal, straight text; could be italic or oblique.
			fontWeight: 400, // Normal text weight, lower is thinner; higher thicker.
		}
	};
	return Text;
});

define('tcg/ygo/Resources',[], function()
{
	return typeof NCM_RESOURCES !== "undefined" 
	? NCM_RESOURCES 
	: "res";
});
define('tcg/ygo/Rarities',["./Resources"], function(resources)
{
	var path = [resources, "tcg", "ygo", "foil"].join("/");
	return {
		common:   {
            name: "Common",
            foil: undefined,
            color: undefined
        },
		rare:     {
            name: "Rare",
            foil: undefined,
            color: "silver"
        },
		ultra:    {
            name: "Ultra rare",
            foil: [ path, "Secret.png" ].join("/"),
            color: "gold"
        },
		secret:   {
            name: "Secret rare",
            foil: [ path, "Secret.png" ].join("/"),
            color: "silver"
        },
		mosaic:   {
            name: "Mosaic rare",
            // foil: [ path, "Ultimate.png" ].join("/"),
            foil: [ path, "Secret.png" ].join("/"),
            // foil: undefined,
            cardFoil: [ path, "Mosaic.png" ].join("/"),
            color: "silver",
        },
        shatter: {
            name: "Shatterfoil rare",
            foil: undefined,
            color: undefined,
            cardFoil: [ path, "Shatter.png" ].join("/"),
        },
        rainbow: {
            name: "Rainbow rare",
            foil: [ path, "Ultimate.png" ].join("/"),
            foilBlend: "normal",
            color: "white",
            cardFoil: [ path, "Rainbow.png" ].join("/"),
        },
	};
});

define('tcg/ygo/layout/component/CardName',["react", "react-class", "draw/Text", "../../Rarities"], function CardName(React, ReactClass, Text, Rarities)
{

	var stylePreset =  {
		regular: {
			fontFamily: ["Matrix Regular Small Caps", "Spectral SC", "serif"],
			fontSize: 46,
			fontStyle: "normal",
			fontWeight: 400,
			textAlign: "left",
			whitespace: "nowrap",

			left: 28,
			top: 12,
			width: 323,
			height: 48
		},
		skill: {
			fontFamily: ["Heebo", "sans-serif"],
			fontSize: 32,
			fontStyle: "normal",
			fontWeight: 500,
			textAlign: "left",
			whitespace: "nowrap",

			left: 32,
			top: 24,
			width: 315,
			height: 48
		},
        rush: {
			fontFamily: ["Matrix Regular Small Caps", "Spectral SC", "serif"],
			fontSize: 46,
			fontStyle: "normal",
			fontWeight: 400,
			textAlign: "left",
			whitespace: "nowrap",

			left: 28,
			top: 4,
			width: 310,
			height: 48
        }
	}
	var colors = {
		default: { highlight: { color: "transparent" }, base: { color: "#000"} },
		white: { highlight: { color: "transparent" }, base: { color: "#FFF"} },
		silver: { highlight: { color: "#b6b6b6" }, base: { color: "#1e1e1e"} },
		gold: { highlight: { color: "#d3b146"}, base: {color: "#4e3518"}}
	}

	var CardName = ReactClass({
		render: function render()
		{
			var color = (Rarities[this.props.rarity] || {}).color || this.props.color;
            let styleKey = this.props.type;
            if(this.props.variant === "Rush") {
                styleKey = "rush";
            }
			var style = stylePreset[styleKey] || stylePreset.regular;

			return React.createElement(
				React.Fragment,
				null,
				React.createElement(Text,
				{
					text: this.props.value,
					style: Object.assign({}, style, (colors[color] || colors.default).highlight, { top: style.top-1, left: style.left-1 }),
					repaint: this.props.repaint,
					canvas: this.props.canvas
				}),
				React.createElement(Text,
					{
						text: this.props.value,
						style: Object.assign({}, style, (colors[color] || colors.default).base),
						repaint: this.props.repaint,
						canvas: this.props.canvas
					}
				)
			);
		}
	});
	CardName.displayName = "CardName";
	CardName.defaultProps = {
		value: "",
		rarity: "common",
		type: "regular",
		color: "black"
	};
	return CardName;
});

define('tcg/ygo/Attributes',["./Resources"], function Attributes(resources)
{
	var path = [resources, "tcg", "ygo", "attribute"].join("/");
	return {
		None:     { url: undefined },
		Dark:     { url: [path, "Dark.png"].join("/") },
		Divine:   { url: [path, "Divine.png"].join("/") },
		Earth:    { url: [path, "Earth.png"].join("/") },
		Fire:     { url: [path, "Fire.png"].join("/") },
		Light:    { url: [path, "Light.png"].join("/") },
		Water:    { url: [path, "Water.png"].join("/") },
		Wind:     { url: [path, "Wind.png"].join("/") },
		Spell:    { url: [path, "Spell.png"].join("/") },
		Trap:     { url: [path, "Trap.png"].join("/") },
        Rainbow:  { url: [path, "Rainbow.png"].join("/") },
        Void:     { url: [path, "Void.png"].join("/") },
	};
});

define('draw/Image',["react", "react-class"], function Image(React, ReactClass)
{
	/**
	 * Image to draw on a canvas.
	 *
	 * In case no canvas DOM element is provided to it, it should default to
	 * a regular DOM image.
	 */
	var image = ReactClass({
		getInitialState: function initialState()
		{
			return { image: null };
		},

		render: function render()
		{
			return React.createElement(
				"img",
				{
					src: this.props.src,
					crossOrigin: "anonymous",
					onLoad: this.onLoad,
					style: {
						position: "absolute",
						left: this.props.style.left,
						top: this.props.style.top,
						width: this.props.style.width,
						height: this.props.style.height,
						mixBlendMode: this.props.style.mixBlendMode
					}
				}
			)
		},

		onLoad: function loaded(img)
		{
			this.setState({ image: img.target });
			this.props.repaint();
		},

		componentDidUpdate: function()
		{
			var canvas = this.props.canvas;
			// Make sure the image has downloaded.
			if (canvas !== null && this.state.image !== null)
			{
				var ctx = canvas.getContext("2d");
				ctx.save();
				ctx.globalCompositeOperation = this.props.style.mixBlendMode;
				ctx.drawImage(
					this.state.image,
					this.props.style.left,
					this.props.style.top,
					// Width and height might not be provided, default to the dimensions
					// of the specified image in that case. Note that a width of 0 results
					// in the default size.
					this.props.style.width || this.state.image.width,
					this.props.style.height || this.state.image.height
				);
				ctx.restore();
			}
		}
	});
	// The compiler warns about "getDefaultProps" being deprecated.
	// Assigning them this way seems to solve it.
	image.defaultProps = {
		style: {
			left: 0, //
			top: 0,
			width: undefined,
			height: undefined,
			mixBlendMode: "normal"
		},
		canvas: null,
		repaint: function repaint(){/* Empty function.*/}
	};

	return image;
});

define('tcg/ygo/layout/component/Attribute',["react", "react-class", "../../Attributes", "draw/Image"],
function Attribute(React, ReactClass, Attributes, Image)
{
    let styles = {
        Normal: {
            // Positioning based on 420 × 610.
            // TODO: update for 421 x 614
            left:  356,
            top:    27,
            width:  40,
            height: 40,
        },
        Anime: {
            left:  344,
            top:   477,
            width:  40,
            height: 40,
        },
        AnimeBackrow: {
            left:  190,
            top:   517,
            width:  40,
            height: 40,
        },
        Rush: {
            left:  345,
            top:    22,
            width:  54,
            height: 54
        }
    }
	var Attribute = ReactClass({
		render: function render()
		{
            // let style = this.props.anime ? styles.Anime : styles.Normal;
            let style;
            let url = Attributes[this.props.value].url
            if(this.props.variant === "Anime") {
                style = this.props.backrow ? styles.AnimeBackrow : styles.Anime;
            }
            else if(this.props.variant === "Rush") {
                style = styles.Rush;
                if(!url) {
                    url = Attributes["Void"].url;
                }
                url = url.replace(".png", ".rush.png");
            }
            else {
                style = styles.Normal;
            }
			var props = Object.assign({}, this.props, {
				// Maps the attribute to a path name
				src: url,
				style: style,
			});
			return React.createElement(Image, props);
		}
	});
	Attribute.displayName = "Attribute";
	Attribute.defaultProps = {
		value: "None",
	};

	return Attribute;
});

define('tcg/ygo/layout/component/Border',["react", "react-class", "draw/Image", "../../Resources"],
function Border(React, ReactClass, Image, resources) {
	var Border = ReactClass({
		render: function render()
		{
			let border = resources + "/tcg/ygo/border/" + this.props.value + ".png";
            let isAnime = this.props.variant === "Anime";
            let isRush = this.props.variant === "Rush";
			if (this.props.pendulum && this.props.pendulum.enabled && !isRush)
			{
                let suffix = "pendulum";
                if(this.props.pendulum.boxSize !== "Normal"
                && this.props.pendulum.boxSizeEnabled
                && !isAnime)
                {
                    suffix += "." + this.props.pendulum.boxSize.toLowerCase();
                }
                suffix = "." + suffix + ".png";
				border = border.replace(".png", suffix);
			}
            if(isAnime) {
                border = border.replace(".png", ".anime.png");
            }
            else if(isRush) {
                border = border.replace(".png", ".rush.png");
            }
			return React.createElement(Image, {
				src: border,
				style: {
					left: 0,
					top: 0,
					width: 421,
					height: 614
				},
				canvas: this.props.canvas,
				repaint: this.props.repaint
			});
		}
	});
	Border.displayName = "Border";
	Border.defaultProps = {
		value: "Normal"
	};
	return Border;
});

define('tcg/ygo/layout/component/Image',["react", "react-class", "draw/Image", "../../Rarities"], function Image(React, ReactClass, Img, Rarities)
{
	var styles = {
        Normal: {
    		Normal: {
    			left: 47,
                top: 109,
    			width: 326,
    			height: 326,
    		},
    		Pendulum: {
    			left: 25,
    			top: 107,
    			width: 371,
    			height: 371,
    		},
        },
        Anime: {
    		Normal: {
    			left: 12,
                top: 12,
    			width: 397,
    			height: 437,
    		},
    		Pendulum: {
    			left: 12,
                top: 12,
    			width: 397,
    			height: 437,
    		},
        },
        Rush: {
    		Normal: {
    			left: 22,
                top: 61,
    			width: 376, // min width: 376
    			height: 380,
    		},
        }
	}

	var Image = ReactClass({
		render: function render()
		{
            // let base = this.props.anime ? styles.Anime : styles.Normal;
            let base = styles[this.props.variant] || styles.Normal;
			let style = this.props.pendulum ? base.Pendulum : base.Normal;
            style = style || base.Normal;
			let foil = React.createElement("span");
            let rarityInfo = Rarities[this.props.rarity] || {};
			return React.createElement(
				React.Fragment,
				null,
				React.createElement(
					Img,
					{
						src: this.props.value,
						style: style,
						repaint: this.props.repaint,
						canvas: this.props.canvas
					}
				),
                // picture foil
				React.createElement(
					Img,
					{
						src: rarityInfo.foil,
						style: Object.assign({}, style, { mixBlendMode: rarityInfo.foilBlend || "color-dodge"}),
						repaint: this.props.repaint,
						canvas: this.props.canvas

					}
				)
			);
		}
	});
	Image.displayName = "Image";
	Image.defaultProps = {
		rarity: "common"
	};
	return Image;
});

define('tcg/ygo/Stars',["./Resources"], function(resources)
{
	var path = [resources, "tcg", "ygo", "star"].join("/");

	return {
		Normal:   { url: [ path, "Normal.png" ].join("/") },
		Negative: { url: [ path, "Negative.png" ].join("/") },
		Xyz:      { url: [ path, "Xyz.png" ].join("/") },
        Yellow:   { url: [ path, "Yellow.png" ].join("/") },
        Galaxy:   { url: [ path, "Galaxy.png" ].join("/") },
        Rainbow:  { url: [ path, "Rainbow.png" ].join("/") },
	};
});

define('tcg/ygo/layout/component/Level',["react", "react-class", "../../Stars", "draw/Group", "draw/Image", "draw/Text"],
function Level(React, ReactClass, Stars, Group, Image, Text)
{
	// Maximum number of stars to draw at a time. Should not be 0.
	var MAX_LEVEL = 12;

    let strategies = {
        Normal: [
	       // styleForLevel_1_through_11
           {
        		float: "right",

        		// Positioning based on 420 × 610.
                // TODO: update for 421 x 614
        		left: 43, // (420 - width) / 2
        		top: 73, // Measured from the image.

        		width: 28, // Width of a star.
        		height: 28, // Height of a star.
        		maxWidth: 334, // Max width of the total number of stars.

                // range of levels it applies to
                range: [1, 11]
            },
        	// styleForLevel_12
            {
        		float: "right",

        		// Positioning based on 420 × 610.
        		left: 35, // (420 - width) / 2
        		top: 73, // Measured from the image.

        		width: 28, // Width of a star.
        		height: 28, // Height of a star.
        		maxWidth: 350, // Max width of the total number of stars.
                range: [12]
        	}
    	],
        Anime: [
           {
        		float: "right",

        		left: 36,
        		top: 483,

        		width: 28, // Width of a star.
        		height: 28, // Height of a star.
        		maxWidth: 284, // Max width of the total number of stars.

                // range of levels it applies to
                range: [1, 10]
            },
            {
        		float: "right",

        		left: 21,
        		top: 483,

        		width: 28, // Width of a star.
        		height: 28, // Height of a star.
        		maxWidth: 312, // Max width of the total number of stars.
                range: [11]
        	},
            {
        		float: "right",

        		// Positioning based on 420 × 610.
        		left: 14, // (420 - width) / 2
        		top: 483, // Measured from the image.

        		width: 28, // Width of a star.
        		height: 28, // Height of a star.
        		maxWidth: 320, // Max width of the total number of stars.
                range: [12]
        	}
    	],
    };

    let LevelStrategy = {
        Normal: null,
        Anime: null,
    };
    for(let key of Object.keys(LevelStrategy)) {
        let strategy = [ null ];
        for(let segment of strategies[key]) {
            let [ start, end ] = segment.range;
            end = typeof end === "undefined" ? start : end;
            delete segment.range;
            for(let i = start; i <= end; i++) {
                strategy[i] = segment;
            }
        }
        LevelStrategy[key] = strategy;
    }
    let StarStrokeColors = {
        "Normal": "#dc3523",
        "Xyz": "#000000",
        "Rainbow": "#555500",
        // "Rainbow": gradient,
    };

	var Level = ReactClass({
        renderStrategy: function renderStrategy()
        {
            this.props.variant = this.props.variant || "Normal";
            let strategy = LevelStrategy[this.props.variant];
            // console.log("Strategy:", strategy, this.props);
            // Calculate the spacing between each star.
            let styleForLevel_12 = strategy[12];

            var spacing = ((styleForLevel_12.maxWidth - (MAX_LEVEL * styleForLevel_12.width)) / MAX_LEVEL);
			// Contains the images which will eventually be drawn.
			var levels = [];
			var level = Math.min(Math.abs(this.props.value), MAX_LEVEL);

			var style = strategy[level] || {};

			var rtl = this.props.value > 0;

			var width = rtl ? (style.maxWidth - (style.width + spacing)) : 0;
			var direction = rtl ? -1 : 1;

			// Generate the images which will be drawn, but no more than allowed.
			for (var i=0; i<level; ++i)
			{
				levels[levels.length] = React.createElement(
					Image,
					{
						// Get the url of the star to draw on the image.
						src: Stars[this.props.star].url,
						// React requires identifiers when assigning children by an array.
						key: "star:" + i,
						style: {
							// Position the star based on its number.
							left: style.left + width + (direction * (i * (style.width +spacing))),
							top: style.top,
							// The images used for the stars are square.
							width: style.width,
							height: style.height,
						}
					});

			}
			return React.createElement(
				Group,
				this.props,
				levels
			);
        },
        renderRush: function renderRush() {
            let url = Stars[this.props.star].url;
            url = url.replace(".png", ".rush.png");
            let img = React.createElement(
                Image,
                {
                    // Get the url of the star to draw on the image.
                    src: url,
                    // React requires identifiers when assigning children by an array.
                    // key: "star",
                    style: {
                        left: 24,
                        top: 370,
                        width: 63,
                        height: 68,
                    }
                }
            );
            let strokeColor = StarStrokeColors[this.props.star] || StarStrokeColors.Normal;

            let text = React.createElement(Text, {
                text: Math.abs(this.props.value).toString(),
                style: {
            		fontFamily: ["Eurostile Candy W01", "Palatino Linotype", "Crimson Text", "serif"],
            		fontSize: 28,
            		textAlign: "center",
            		whitespace: "nowrap",
                    color: "white",
            		fontWeight: 600,

                    strokeColor: strokeColor,
                    strokeWidth: 3,

                    left: 32,
                    top: 392,
                    width: 45,
                    height: undefined
                },
                key: "leveltext"
            });
            return React.createElement(
                Group,
                this.props,
                [ img, text ]
            );
        },
		render: function render()
		{
            if(this.props.variant === "Rush") {
                return this.renderRush();
            }
            else {
                return this.renderStrategy();
            }
		}
	});
	// Make the name slightly more descriptive when debugging.
	Level.displayName = "Level";
	Level.defaultProps = {

	};
	return Level;
});

define('tcg/ygo/Icons',["./Resources"], function(resources)
{
	var path = [resources, "tcg", "ygo", "icon"].join("/");
	return {
		"None":       { url: null },
		"Continuous": { url: [ path, "Continuous.png" ].join("/") },
		"Counter":    { url: [ path, "Counter.png" ].join("/") },
		"Equip":      { url: [ path, "Equip.png" ].join("/") },
		"Field":      { url: [ path, "Field.png" ].join("/") },
		"Quick-play": { url: [ path, "Quick-play.png" ].join("/") },
		"Ritual":     { url: [ path, "Ritual.png" ].join("/") },
        "Splice":     { url: [ path, "Splice.png" ].join("/") },
	};
});

define('tcg/ygo/layout/component/Type',["react", "react-class", "draw/Group", "draw/Image", "draw/Text", "../../Icons", "../../Resources"],
function Type(React, ReactClass, Group, Image, Text, Icons, resources) {
    const measureText = function (self, text) {
        if(self.props.canvas) {
            let ctx = self.props.canvas.getContext("2d");
            let style = JSON.parse(JSON.stringify(text.props.style));
            // the following is copied from Text.js
            ctx.font = [
                style.fontStyle, // "normal", "italic" or "oblique".
                style.fontVariant,
                style.fontWeight, // "thin", "normal", "bold". Can also be a number.
                style.fontSize + "px", // Size of the text in pixels.
                style.fontFamily // Array in the order of which font should be tried.
            ].join(" ");
            let measure = ctx.measureText(self.props.value);
            return measure;
        }
        return { width: 0 };
    };
    const ICON_MARGIN_LEFT = 2;
	var styles = {
        Normal: {
    		Monster: {
    			fontFamily: ["Stone Serif Small Caps", "Matrix Regular Small Caps", "Stone Serif Regular", "Spectral SC", "serif"],
    			fontSize: 16,
    			fontWeight: 400,
    			textAlign: "left",
    			whitespace: "nowrap",

    			// left: 30,
    			left: 36,
    			top: 461,
    			width: 350,
    			height: 30
    		},
    		LargePendulumMonster: {
    			fontFamily: ["Stone Serif Small Caps", "Matrix Regular Small Caps", "Stone Serif Regular", "Spectral SC", "serif"],
    			fontSize: 16,
    			fontWeight: 400,
    			textAlign: "left",
    			whitespace: "nowrap",

    			// left: 30,
    			left: 36,
    			top: 477,
    			width: 350,
    			height: 30
    		},
    		Backrow: {
    			Icon:
    			{
    				left: 421-24-50,
    				top: 77,
    				width: 24,
    				height: 24
    			},
    			Type:
    			{
    				fontFamily: ["Stone Serif Small Caps", "Stone Serif Regular", "Spectral SC", "serif"],
    				fontSize: 19.75,
    				fontWeight: 400,
    				textAlign: "right",
    				whitespace: "nowrap",

    				left: 40,
    				top: 75,
    				width: 330,
    				height: 20,
    			},
    			TypeWithIcon:
    			{
    				fontFamily: ["Stone Serif Small Caps", "Stone Serif Regular", "Spectral SC", "serif"],
    				fontSize: 19.75,
    				fontWeight: 400,
    				textAlign: "right",
    				whitespace: "nowrap",

    				left: 40,
    				top: 75,
    				width: 421 - 24/*width of icon*/ -50 /**/-40 - ICON_MARGIN_LEFT,
    				height: 20
    			},
    			TypeWithIconClosing: {

    				fontFamily: ["Stone Serif Small Caps", "Stone Serif Regular", "Spectral SC", "serif"],
    				fontSize: 24,
    				fontWeight: 400,
    				textAlign: "left",
    				whitespace: "nowrap",

    				left: 421-50,
    				top: 75,
    				width: 10,
    				height: 20
    			}
    		},
            Braces: {
                Monster: {
                    width: 5,
                    height: 15,
                    top: 465,
                },
                LargePendulumMonster: {
                    width: 5,
                    height: 15,
                    top: 465+16,
                },
                Backrow: {
                    top: 79,
                    width: 6,
                    height: 20,
                }
            }
        },
        Rush: {

    		Monster: {
    			fontFamily: ["Stone Serif Small Caps", "Matrix Regular Small Caps", "Stone Serif Regular", "Spectral SC", "serif"],
    			fontSize: 16,
    			fontWeight: 400,
    			textAlign: "left",
    			whitespace: "nowrap",

    			// left: 30,
    			left: 36,
    			top: 443,
    			width: 350,
    			height: 30
    		},
    		// LargePendulumMonster: {
    		// 	fontFamily: ["Stone Serif Small Caps", "Matrix Regular Small Caps", "Stone Serif Regular", "Spectral SC", "serif"],
    		// 	fontSize: 16,
    		// 	fontWeight: 400,
    		// 	textAlign: "left",
    		// 	whitespace: "nowrap",
            //
    		// 	// left: 30,
    		// 	left: 36,
    		// 	top: 477,
    		// 	width: 350,
    		// 	height: 30
    		// },
    		Backrow: {
    			Icon:
    			{
    				left: 421-24-50,
    				top: 443,
    				width: 20,
    				height: 20
    			},
    			Type:
    			{
    				fontFamily: ["Stone Serif Small Caps", "Stone Serif Regular", "Spectral SC", "serif"],
    				fontSize: 16,
    				fontWeight: 400,
    				textAlign: "left",
    				whitespace: "nowrap",

    				left: 38,
    				top: 443,
    				width: 330,
    				height: 20,
    			},
    			TypeWithIcon:
    			{
    				fontFamily: ["Stone Serif Small Caps", "Stone Serif Regular", "Spectral SC", "serif"],
    				fontSize: 16,
    				fontWeight: 400,
    				textAlign: "left",
    				whitespace: "nowrap",

    				left: 38,
    				top: 443,
    				width: 421 - 24/*width of icon*/ -50 /**/-40 - ICON_MARGIN_LEFT,
    				height: 20
    			},
    			TypeWithIconClosing: {

    				fontFamily: ["Stone Serif Small Caps", "Stone Serif Regular", "Spectral SC", "serif"],
    				fontSize: 16,
    				fontWeight: 400,
    				textAlign: "left",
    				whitespace: "nowrap",

    				left: 421-50,
    				top: 75,
    				width: 10,
    				height: 20
    			}
    		},
            Braces: {
                Monster: {
                    width: 5,
                    height: 15,
                    top: 447,
                },
                // LargePendulumMonster: {
                //     width: 5,
                //     height: 15,
                //     top: 465+16,
                // },
                Backrow: {
                    top: 447,
                    width: 5,
                    height: 15,
                }
            }
        }
	};

	var Type = ReactClass({
		render: function render() {
            let isWhite = this.props.color === "white";
            let suffix = isWhite ? "white" : "";
            let openingBrace = React.createElement(Image, {
                src: resources + "/tcg/ygo/text/leftbracket" + suffix + ".png",
                key: "openBrace",
                style: {},
            });
            let closingBrace = React.createElement(Image, {
                src: resources + "/tcg/ygo/text/rightbracket" + suffix + ".png",
                key: "closeBrace",
                style: {},
            });

            let type = this.props.type;
            type = type.replace("Vanilla", "Monster")
                       .replace("Rush", "");

            let baseStyle = styles[this.props.variant] || styles.Normal;
            let isRush = this.props.variant === "Rush";

			if(type === "Backrow") {
                let hasIcon = Icons[this.props.icon] && Icons[this.props.icon].url !== null;
				var withIcon;
                let style = Object.assign(
                    { color: this.props.color },
                    baseStyle.Backrow[hasIcon ? "TypeWithIcon" : "Type"]
                );
                let text = React.createElement(Text, {
                    text: this.props.value,
                    style: style,
                    key: "type"
                });
                let width = measureText(this, text).width;
                if(hasIcon) {
                    width += baseStyle.Backrow.Icon.width;
                }
                Object.assign(closingBrace.props.style, baseStyle.Braces.Backrow, {
                    left: isRush ? width + 18 + 24 : 421-49,
                    // left: 421-49,
                });
                Object.assign(openingBrace.props.style, baseStyle.Braces.Backrow, {
                    left: isRush ? 30 : 421 - 50 - 7 - width,
                });
                withIcon = [
                    openingBrace,
                    text,
                    closingBrace
				];
                if(hasIcon) {
                    let iconStyle = {};
                    Object.assign(iconStyle, baseStyle.Backrow.Icon);
                    if(isRush) {
                        iconStyle.left = width + 20;
                    }

                    withIcon.splice(2, 0, React.createElement(Image, {
                        src: (Icons[this.props.icon] || { url: "" }).url,
                        style: iconStyle,
                        key: "icon"
                    }));
                    if(this.props.value.length && !isRush) {
                        openingBrace.props.style.left -= ICON_MARGIN_LEFT;
                    }
                }

				return React.createElement(
					Group,
					{
						canvas: this.props.canvas,
						repaint: this.props.repaint
					},
					withIcon
				);
            }
			else if(type === "Monster" || type === "LargePendulumMonster") {
                Object.assign(openingBrace.props.style, baseStyle.Braces[type], {
                    left: 30,
                });
                let style = Object.assign(
                    { color: this.props.color },
                    baseStyle[type]
                );
                let text = React.createElement(
                    Text,
                    {
                        text: this.props.value,
                        style: style,
                    }
                );
                let width = measureText(this, text).width;
                Object.assign(closingBrace.props.style, baseStyle.Braces[type], {
        			left: Math.floor(37 + width),
                });
				return React.createElement(
					Group,
					{
						canvas: this.props.canvas,
						repaint: this.props.repaint
					},
                    openingBrace,
                    text,
                    closingBrace
				);
			}
			return null;
		}
	});
	Type.displayName = "Circulation";
	Type.defaultProps = {
		value: "",
		icon: "None",
		type: "Monster", // The other option is "Backrow".
	};
	return Type;
});

define('tcg/ygo/layout/component/Effect',["react", "react-class", "draw/Text"], function Effect(React, ReactClass, Text)
{
	var styles = {
		Monster: {
			fontFamily: ["Matrix Book", "Spectral", "serif"],

			fontSize: 18,
			textAlign: "justify",

			left: 30,
			top: 478,
			width: 360,
			height: 75
		},
		Backrow: {
			fontFamily: ["Matrix Book", "Spectral", "serif"],

			fontSize: 18,
			textAlign: "justify",

			left: 30,
			top: 461,
			width: 360,
			height: 110
		},
        LargePendulumMonster: {
			fontFamily: ["Matrix Book", "Spectral", "serif"],

			fontSize: 18,
			textAlign: "justify",

			left: 30,
			top: 494,
			width: 360,
			height: 65,
        },
		Vanilla: {
			fontFamily: ["Stone Serif Italic", "Amiri", "serif"],
			fontStyle: "italic",
            fontWeight: 400,
			fontSize: 18,
			textAlign: "justify",

			left: 30,
			top: 478,
			width: 360,
			height: 75
		},
        LargePendulumVanilla: {
			fontFamily: ["Matrix Book", "Spectral", "serif"],

			fontSize: 18,
			textAlign: "justify",

			left: 30,
			top: 494,
			width: 360,
			height: 65,
        },

		Skill: {
			fontFamily: ["Matrix Book", "Spectral", "serif"],

			fontSize: 18,
			textAlign: "justify",

			left: 30,
			top: 478,
			width: 360,
			height: 95
		},
        RushMonster: {
			fontFamily: ["Matrix Book", "Spectral", "serif"],

			fontSize: 18,
			textAlign: "justify",

			left: 30,
			top: 466,
			width: 360,
			height: 103,
        },
        // RushBackrow is the same as RushMonster
        RushBackrow: {
			fontFamily: ["Matrix Book", "Spectral", "serif"],

			fontSize: 18,
			textAlign: "justify",

			left: 30,
			top: 466,
			width: 360,
			height: 103,
        },
        RushVanilla: {
			fontFamily: ["Stone Serif Italic", "Amiri", "serif"],
			fontStyle: "italic",
            fontWeight: 400,
			fontSize: 18,
			textAlign: "justify",

			left: 30,
			top: 466,
			width: 360,
			height: 103,
        },
	}

	var Effect = ReactClass({
		render: function render()
		{
			return React.createElement(
				Text,
				{
					text: this.props.value,
					style: Object.assign({}, styles[this.props.type]),
					repaint: this.props.repaint,
					canvas: this.props.canvas
				}
			);
		}
	});
	Effect.displayName = "Effect";
	Effect.defaultProps = {
		value: "",
		// Affects the positioning; backrow gets more room since it does not have
		// to accomodate for the ATK / DEF values among other things.
		// Pendulum effects are slightly tighter.
		type: "Monster",
		flavour: false,
	};
	return Effect;
});

define('tcg/ygo/layout/component/Atk',["react", "react-class", "draw/Text", "draw/Image"], function Atk(React, ReactClass, Text, Image)
{
	var styles = {
        Normal: {
    		fontFamily: ["Palatino Linotype", "Crimson Text", "serif"],
    		fontSize: 16,
    		textAlign: "right",
    		whitespace: "nowrap",
    		fontWeight: 600,

    		left: 263,
    		top: 560,
    		width: 35,
    		height: undefined
    	},
        Anime: {
    		fontFamily: ["YGODIY-Chinese", "Palatino Linotype", "Crimson Text", "serif"],
    		fontSize: 46,
    		textAlign: "center",
    		whitespace: "nowrap",
    		fontWeight: 600,

    		left: 53,
    		top: 527,
    		width: 124,
    		height: undefined
    	},
        Rush: {
    		fontFamily: ["Eurostile Candy W01", "Palatino Linotype", "Crimson Text", "serif"],
    		fontSize: 19.25,
    		textAlign: "right",
    		whitespace: "nowrap",
            color: "white",
    		fontWeight: 600,

            strokeColor: "#000000",
            strokeWidth: 3,

    		left: 147,
    		top: 411,
    		width: 75,
    		height: undefined
    	},
        AnimeInfinity: {
            left: 79,
            top: 542,
            width: 72,
            height: 33,
        }
    };
	var Atk = ReactClass({
		render: function render()
		{
            if(this.props.variant === "Anime" && this.props.value === "∞") {
                return React.createElement(Image, {
                    src: "../res/tcg/ygo/text/infinityanime.png",
                    style: styles.AnimeInfinity,
                    repaint: this.props.repaint,
                    canvas: this.props.canvas
                });
            }
            let style = styles[this.props.variant] || styles.Normal;
			return React.createElement(Text, {
                text: this.props.value,
                style: style,
                repaint: this.props.repaint,
                canvas: this.props.canvas
            });
		}
	});

	Atk.displayName = "Atk";
	Atk.defaultProps = {

	}
	return Atk;
});

define('tcg/ygo/layout/component/Def',["react", "react-class", "draw/Text", "draw/Image"], function Def(React, ReactClass, Text, Image)
{
	var styles = {
        Normal: {
    		fontFamily: ["Palatino Linotype", "Crimson Text", "serif"],
    		fontSize: 16,
    		textAlign: "right",
    		whitespace: "nowrap",
    		fontWeight: 600,

    		left: 350,
    		top: 560,
    		width: 35,
    		height: undefined
        },
        Anime: {
    		fontFamily: ["YGODIY-Chinese", "Palatino Linotype", "Crimson Text", "serif"],
    		fontSize: 46,
    		textAlign: "center",
    		whitespace: "nowrap",
    		fontWeight: 600,

    		left: 244,
    		top: 527,
    		width: 124,
    		height: undefined
    	},
        Rush: {
    		fontFamily: ["Eurostile Candy W01", "Palatino Linotype", "Crimson Text", "serif"],
    		fontSize: 19.25,
    		textAlign: "right",
    		whitespace: "nowrap",
            color: "white",
    		fontWeight: 600,

            strokeColor: "#000000",
            strokeWidth: 3,

    		left: 277,
    		top: 411,
    		width: 75,
    		height: undefined
    	},
        AnimeInfinity: {
            left: 270,
            top: 542,
            width: 72,
            height: 33,
        }
	};
	var Def = ReactClass({
		render: function render()
		{
            if(this.props.variant === "Anime" && this.props.value === "∞") {
                return React.createElement(Image, {
                    src: "../res/tcg/ygo/text/infinityanime.png",
                    style: styles.AnimeInfinity,
                    repaint: this.props.repaint,
                    canvas: this.props.canvas
                });
            }
            let style = styles[this.props.variant] || styles.Normal;
            // console.log("STYLE:", style);
            return React.createElement(Text, {
                text: this.props.value,
                style: style,
                repaint: this.props.repaint,
                canvas: this.props.canvas
            });
		}
	});

	Def.displayName = "Def";
	Def.defaultProps = {
		type: "Regular"
	}
	return Def;
});

define('tcg/ygo/layout/component/Pendulum',["react", "react-class", "draw/Group", "draw/Text"],
function Pendulum(React, ReactClass, Group, Text)
{
    let PendulumStyles = {
        Normal: {
            effect: {
                fontFamily: ["Matrix Book", "Spectral", "serif"],

                fontSize: 13,
                textAlign: "justify",

                left: 65,
                top: 389,
                width: 290,
                height: 65,
            },
            blue: {
                fontFamily: ["Crimson Text", "serif"],
                fontSize: 28,
                textAlign: "center",
                fontWeight: 600,

                left: 29,
                top: 416,
                width: 23,
                height: 30
            },
            red: {
                fontFamily: ["Crimson Text", "serif"],
                fontSize: 28,
                textAlign: "center",
                fontWeight: 600,

                left: 368,
                top: 416,
                width: 23,
                height: 30
            }
        },
        Small: {
            effect: {
                fontFamily: ["Matrix Book", "Spectral", "serif"],

                fontSize: 13,
                textAlign: "justify",

                left: 65,
                top: 413,
                width: 290,
                height: 42,
            },
            blue: {
                fontFamily: ["Crimson Text", "serif"],
                fontSize: 28,
                textAlign: "center",
                fontWeight: 600,

                left: 29,
                top: 423,
                width: 23,
                height: 30
            },
            red: {
                fontFamily: ["Crimson Text", "serif"],
                fontSize: 28,
                textAlign: "center",
                fontWeight: 600,

                left: 368,
                top: 423,
                width: 23,
                height: 30
            }
        },
        Large: {
            effect: {
                fontFamily: ["Matrix Book", "Spectral", "serif"],

                fontSize: 13,
                textAlign: "justify",

                left: 65,
                top: 389,
                width: 290,
                height: 81,
            },
            blue: {
                fontFamily: ["Crimson Text", "serif"],
                fontSize: 28,
                textAlign: "center",
                fontWeight: 600,

                left: 29,
                top: 424,
                width: 23,
                height: 30
            },
            red: {
                fontFamily: ["Crimson Text", "serif"],
                fontSize: 28,
                textAlign: "center",
                fontWeight: 600,

                left: 368,
                top: 424,
                width: 23,
                height: 30
            }
        },
        Anime: {
            effect: {
                fontFamily: ["Matrix Book", "Spectral", "serif"],

                fontSize: 13,
                textAlign: "justify",

                left: 65,
                top: 389,
                width: 290,
                height: 65,
            },
            blue: {
                fontFamily: ["Crimson Text", "serif"],
                fontSize: 28,
                textAlign: "center",
                fontWeight: 600,

                left: 17,
                top: 416,
                width: 23,
                height: 30
            },
            red: {
                fontFamily: ["Crimson Text", "serif"],
                fontSize: 28,
                textAlign: "center",
                fontWeight: 600,

                left: 381,
                top: 416,
                width: 23,
                height: 30
            }
        },
    };
	var Pendulum = ReactClass({
		render: function render()
		{
            let boxSize = "Normal";
            if(this.props.variant === "Anime") {
                boxSize = "Anime";
            }
            else if(this.props.boxSizeEnabled) {
                boxSize = this.props.boxSize;
            }
            let effectStyle = PendulumStyles[boxSize];
            let groupElements = [
                React.createElement(
                    Text,
                    {
                        text: this.props.effect,
                        style: effectStyle.effect
                    }
                ),
                React.createElement(
                    Text,
                    {
                        text: this.props.blue,
                        style: effectStyle.blue
                    }
                ),
                React.createElement(
                    Text,
                    {
                        text: this.props.red,
                        style: effectStyle.red
                    }
                )
            ];
            if(this.props.variant === "Anime") {
                groupElements.shift();
            }
			return this.props.enabled ? React.createElement(
				Group,
				{ canvas: this.props.canvas, repaint: this.props.repaint },
                ...groupElements
			) : null;
		}
	});
	Pendulum.displayName = "Pendulum";
	Pendulum.defaultProperties = {
		enabled: false,
		blue: 0,
		red: 0,
		effect: "",
        boxSize: "Normal",
        boxSizeEnabled: false,
	};
	return Pendulum;
});

define('tcg/ygo/layout/component/Link',["react", "react-class", "draw/Text"], function Link(React, ReactClass, Text)
{
	var style = {
		fontFamily: ["IDroid", "Audiowide", "sans-serif"],
		fontSize: 16,
		textAlign: "right",
		whitespace: "nowrap",
        fontWeight: "200",

		left: 365,
		top: 560,
		width: 20,
		height: undefined
	};

	var Link = ReactClass({
		render: function render()
		{
			return React.createElement(Text, {
                text: this.props.value,
                style: style,
                repaint: this.props.repaint,
                canvas: this.props.canvas
            });
		}
	});

	Link.displayName = "Link";
	Link.defaultProps = {

	}
	return Link;
});

define('tcg/ygo/layout/component/Serial',["react", "react-class", "draw/Text"], function Serial(React, ReactClass, Text)
{
    let shared = {
        fontFamily: ["Stone Serif", "Matrix Book", "Spectral", "serif"],
        fontSize: 12,
        textAlign: "left",
        whitespace: "nowrap",
        height: undefined
    }
    let styles ={
        Normal: {
            left: 18,
            top: 587,
            width: 150,
        },
        Rush: {
            left: 23,
            top: 577,
            width: 133,
            color: "white",
        }
    };
	var Serial = ReactClass({
		render: function render()
		{
            let style = {
                color: this.props.color
            };
            Object.assign(style, shared, styles[this.props.variant] || styles.Normal);
			return React.createElement(Text, {
                text: this.props.value,
                style: style,
                canvas: this.props.canvas,
                repaint: this.props.repaint
            });
		}
	});
	Serial.displayName = "Serial";
	Serial.defaultProps = {
		value: "",
		color: "black"
	};
	return Serial;
});

define('tcg/ygo/layout/component/Copyright',["react", "react-class", "draw/Text"], function Copyright(React, ReactClass, Text)
{
	var Copyright = ReactClass({
		render: function render()
		{
			return React.createElement(Text, { text: this.props.value, style: {
                color: this.props.color,
                // fontSize: 17,
                fontSize: 12,
				fontFamily: ["Stone Serif", "Papyrus"],
				textAlign: "right",
				whitespace: "nowrap",

                left: 230,
				top: 587,
				width: 150,
				// left: 200,
				// top: 584,
				// width: 200,
				height: 14
			}, canvas: this.props.canvas, repaint: this.props.repaint});
		}
	});
	Copyright.displayName = "Copyright";
	Copyright.defaultProps = {
		value: "",
		color: "black"
	};
	return Copyright;
});

define('tcg/ygo/layout/component/LinkMarkers',["react", "react-class", "draw/Group", "draw/Image", "../../Resources"], function LinkMarkers(React, ReactClass, Group, Image, Resources)
{
	var positioning = {
		regular: {
			topLeft: {
				top: 95,
				left: 30,
				width: 43,
				height: 43
			},
			topCenter: {
				top: 88,
				left: (420/2) - (97/2),
				width: 97,
				height: 24
			},
			topRight: {
				top: 95,
				left: 420 - 30 - 43,
				width: 43,
				height: 43
			},
			middleLeft: {
				top: 223,
				left: 24,
				width: 24,
				height: 97
			},
			middleRight: {
				top: 223,
				left: 420 - 24 - 24,
				width: 24,
				height: 97
			},
			bottomLeft: {
				top: 407,
				left: 30,
				width: 43,
				height: 43
			},
			bottomCenter: {
				top: 433,
				left: (420/2) - (97/2),
				width: 97,
				height: 24
			},
			bottomRight: {
				top: 407,
				left: 420 - 30 - 43,
				width: 43,
				height: 43
			}
		},
		pendulum: {
			topLeft: {
				top: 95,
				left: 16,
				width: 42,
				height: 42
			},
			topCenter: {
				top: 86,
				left:(420/2) - (72/2),
				width:72,
				height: 25
			},
			topRight: {
				top: 94,
				left: 420 - 16 - 42,
				width: 42,
				height: 42
			},
			middleLeft: {
				top: 302,
				left: 6,
				width: 25,
				height: 72
			},
			middleRight: {
				top: 302,
				left: 420 - 6 -25,
				width: 25,
				height: 72
			},
			bottomLeft: {
				top: 610 - 23 - 42,
				left: 16,
				width: 42,
				height: 42
			},
			bottomCenter: {
				top: 610 - 13 - 25,
				left:(420/2) - (72/2),
				width:72,
				height: 25
			},
			bottomRight: {
				top: 610 - 23 - 42,
				left: 420 - 16 - 42,
				width: 42,
				height: 42
			}
		},
        anime: {
			topLeft: {
				top: 0,
				left: 0,
				width: 43,
				height: 43
			},
			topCenter: {
				top: 0,
				left: (420/2) - (97/2),
				width: 97,
				height: 24
			},
			topRight: {
				top: 0,
				left: 421 - 43,
				width: 43,
				height: 43
			},
			middleLeft: {
				top: 182,
				left: 0,
				width: 24,
				height: 97
			},
			middleRight: {
				top: 182,
				left: 421 - 24,
				width: 24,
				height: 97
			},
			bottomLeft: {
				top: 418,
				left: 0,
				width: 43,
				height: 43
			},
			bottomCenter: {
				top: 437,
				left: (420/2) - (97/2),
				width: 97,
				height: 24
			},
			bottomRight: {
				top: 418,
				left: 421 - 43,
				width: 43,
				height: 43
			}
        }
	};

	var path = Resources + "/tcg/ygo/marker";
	var LinkMarkers = ReactClass({
		render: function render()
		{
			var e = React.createElement;
			var children = [];

			let property;
            if(this.props.variant === "Anime") {
                property = "anime";
            }
            else if(this.props.pendulum) {
                property = "pendulum";
            }
            else {
                property = "regular";
            }
            let pos = positioning[property];
			for(var key in pos)
			{
				if (pos.hasOwnProperty(key) && this.props.hasOwnProperty(key))
				{
					if (this.props[key] === true)
					{
						children[children.length] = e(Image, { key: key, src:("" + path + "/" + key + ".png"), style: pos[key] });
					}
				}
			}

			return React.createElement(
				Group,
				{
					text: this.props.value,
					repaint: this.props.repaint,
					canvas: this.props.canvas
				},
				children
			);
		}
	});

	LinkMarkers.displayName = "LinkMarkers";
	LinkMarkers.defaultProps = {
		pendulumm: false,
		topLeft: false,
		topCenter: false,
		topRight: false,
		middleLeft: false,
		middleRight: false,
		bottomLeft: false,
		bottomCenter: false,
		bottomRight: false
	}
	return LinkMarkers;
});

define('tcg/ygo/layout/component/Id',["react", "react-class", "draw/Text"], function Id(React, ReactClass, Text)
{
	var shared = {
			fontFamily: ["Stone Serif", "Matrix Book", "Spectral", "serif"],
			fontSize: 12,
			whitespace: "nowrap",

			height: undefined
	}
	var styles = {
		regular: {
			textAlign: "right",
			left: 290,
			top: 441,
			width: 80,
		},
		pendulum: {
			color: "black",
			textAlign: "left",
			left: 32,
			top: 562,
			width: 80,
		},
		link: {
			textAlign: "right",
			left: 265,
			top: 441,
			width: 80,
		},
		rush: {
			textAlign: "right",
			left: 264,
			top: 576,
			width: 131,
            color: "white",
		},
	};

	var Id = ReactClass({
		render: function render()
		{
			return React.createElement(Text, {
                text: this.props.value,
                style: Object.assign({color: this.props.color},
                    shared,
                    styles[this.props.position]
                ),
                canvas: this.props.canvas,
                repaint: this.props.repaint
            });
		}
	});
	Id.displayName = "Id";
	Id.defaultProps = {
		value: "",
		color: "black",
		position: "regular"
	};
	return Id;
});

define('tcg/ygo/layout/component/CardHolo',["react", "react-class", "draw/Image", "../../Resources", "../../Rarities"],
function CardHolo(React, ReactClass, Image, resources, Rarities) {
    let CardHolo = ReactClass({
        render: function render() {
            let holo = (Rarities[this.props.rarity] || {}).cardFoil;
            return React.createElement(Image, {
                src: holo,
                style: {
                    left: 0,
                    top: 0,
                    width: 421,
                    height: 614
                },
                canvas: this.props.canvas,
                repaint: this.props.repaint
            });
        }
    });
    CardHolo.displayName = "CardHolo";
    CardHolo.defaultProps = {

    };
    return CardHolo;
});

define('tcg/ygo/layout/component/All',[
	"./CardName",
	"./Attribute",
	"./Border",
	"./Image",
	"./Level",
	"./Type",
	"./Effect",
	"./Atk",
	"./Def",
	"./Pendulum",
	"./Link",
	"./Serial",
	"./Copyright",
	"./LinkMarkers",
	"./Id",
	"./CardHolo"
], function ygo_template_all(CardName, Attribute, Border, Image, Level, Type, Effect, Atk, Def, Pendulum, Link, Serial, Copyright, LinkMarkers, Id, CardHolo)
{
	return {
		CardName: CardName,
		Attribute: Attribute,
		Border: Border,
		Image: Image,
		Level: Level,
		Type: Type,
		Effect: Effect,
		Atk: Atk,
		Def: Def,
		Pendulum: Pendulum,
		Link: Link,
		Serial: Serial,
		Copyright: Copyright,
		LinkMarkers: LinkMarkers,
		Id: Id,
        CardHolo: CardHolo,
	};
});

define('tcg/ygo/layout/Normal',["react", "react-class", "draw/Group", "./Kind.js", "./component/All"],
function Normal(React, ReactClass, Group, Kind, C) {
	var Normal = ReactClass({
		render: function render()
		{
            let isLargePendulum = false;
            this.props.pendulum.boxSizeEnabled = this.props.boxSizeEnabled;
            if(this.props.pendulum.enabled && this.props.boxSizeEnabled) {
                isLargePendulum = this.props.pendulum.boxSize === "Large";
            }
            let isRush = this.props.variant === "Rush";
            let position = isRush ? "rush" : this.props.pendulum.enabled ? "pendulum" : "regular";
            let type = isRush ? "RushVanilla" : isLargePendulum ? "LargePendulumVanilla" : "Vanilla";
            if(this.props.variant === "Anime") {
                return React.createElement(
                    Group,
                    this.props,
                    React.createElement(C.Image, { value: this.props.image, pendulum: this.props.pendulum.enabled, rarity: this.props.rarity, variant: this.props.variant }),
                    React.createElement(C.Border, { value: "Normal", pendulum: this.props.pendulum, variant: this.props.variant }),
                    React.createElement(C.Attribute, { value: this.props.attribute, variant: this.props.variant,  }),
                    React.createElement(C.Pendulum, Object.assign({ variant: this.props.variant }, this.props.pendulum)),
                    React.createElement(C.CardHolo, { rarity: this.props.rarity }),

    				React.createElement(C.Atk, { value: this.props.atk, variant: this.props.variant }),
    				React.createElement(C.Def, { value: this.props.def, variant: this.props.variant }),

                    React.createElement(C.Level, { value: this.props.level, star: "Normal", variant: this.props.variant }),
                );
            }
			return React.createElement(
				Group,
				this.props,
                React.createElement(C.Image, {
					value: this.props.image,
                     pendulum: this.props.pendulum.enabled,
                     rarity: this.props.rarity,
                     variant: this.props.variant
				}),
				React.createElement(C.Border, {
					value: "Normal",
                     pendulum: this.props.pendulum,
                     variant: this.props.variant
				}),
				React.createElement(C.CardName, {
					value: this.props.name,
                     rarity: this.props.rarity,
                     variant: this.props.variant
				}),
				React.createElement(C.Attribute, {
					value: this.props.attribute,
                     variant: this.props.variant
				}),
				React.createElement(C.Level, {
					value: this.props.level,
                     star: "Normal",
                     variant: this.props.variant
				}),

				React.createElement(C.Pendulum, isRush ? {} : this.props.pendulum),

				React.createElement(C.Type, {
					value: this.props.type,
                     type: type,
                     variant: this.props.variant
				}),
				React.createElement(C.Effect, {
					value: this.props.effect,
                     type: type,
                     variant: this.props.variant
				}),

				React.createElement(C.Atk, {
					value: this.props.atk,
                     variant: this.props.variant
				}),
				React.createElement(C.Def, {
					value: this.props.def,
                     variant: this.props.variant
				}),

				React.createElement(C.Serial, {
					value: this.props.serial,
                     variant: this.props.variant
				}),
				React.createElement(C.Id, {
					value: this.props.id,
                     position: position
				}),
				React.createElement(C.Copyright, {
                    value: isRush ? "" : this.props.copyright
				}),

                React.createElement(C.CardHolo, {
					rarity: this.props.rarity
				}),
			);

			//return React.createElement(Shared, Object.assign({}, this.props, { border: this.props.pendulum.enabled ? "res/tcg/ygo/border/Normal.pendulum.png" : "res/tcg/ygo/border/Normal.png"}))
		}
	});
	Normal.displayName = "Normal";
    Normal.kind = Kind.Monster;
	Normal.defaultProps = {
        boxSizeEnabled: true,
	};
    Normal.hasPendulum = true;
	return Normal;
});

define('tcg/ygo/layout/Effect',["react", "react-class", "draw/Group", "./Kind.js", "./component/All"],
function Effect(React, ReactClass, Group, Kind, C) {
	var Effect = ReactClass({
		render: function render()
		{
            let isLargePendulum = false;
            this.props.pendulum.boxSizeEnabled = this.props.boxSizeEnabled;
            if(this.props.pendulum.enabled && this.props.boxSizeEnabled) {
                isLargePendulum = this.props.pendulum.boxSize === "Large";
            }
            let isRush = this.props.variant === "Rush";
            let position = isRush ? "rush" : this.props.pendulum.enabled ? "pendulum" : "regular";
            let type = isRush ? "RushMonster" : isLargePendulum ? "LargePendulumMonster" : "Monster";
            if(this.props.variant === "Anime") {
                return React.createElement(
                    Group,
                    this.props,
                    React.createElement(C.Image, { value: this.props.image, pendulum: this.props.pendulum.enabled, rarity: this.props.rarity, variant: this.props.variant }),
                    React.createElement(C.Border, { value: "Effect", pendulum: this.props.pendulum,  variant: this.props.variant, }),
                    React.createElement(C.Attribute, { value: this.props.attribute, variant: this.props.variant, }),
                    React.createElement(C.Pendulum, Object.assign({ variant: this.props.variant }, this.props.pendulum)),
                    React.createElement(C.CardHolo, { rarity: this.props.rarity }),

    				React.createElement(C.Atk, { value: this.props.atk, variant: this.props.variant }),
    				React.createElement(C.Def, { value: this.props.def, variant: this.props.variant }),

                    React.createElement(C.Level, { value: this.props.level, star: "Normal", variant: this.props.variant }),
                );
            }
            return React.createElement(
				Group,
				this.props,
				React.createElement(C.Image, {
                    value: this.props.image,
                    pendulum: this.props.pendulum.enabled,
                    rarity: this.props.rarity,
                    variant: this.props.variant
                }),
				React.createElement(C.Border, {
                    value: "Effect",
                    pendulum: this.props.pendulum,
                    variant: this.props.variant
                }),
				React.createElement(C.CardName, {
                    value: this.props.name,
                    rarity: this.props.rarity,
                    variant: this.props.variant
                }),
				React.createElement(C.Attribute, {
                    value: this.props.attribute,
                    variant: this.props.variant
                }),
				React.createElement(C.Level, {
                    value: this.props.level,
                    star: "Normal",
                    variant: this.props.variant
                }),

                React.createElement(C.Pendulum, isRush ? {} : this.props.pendulum),

				React.createElement(C.Type, {
                    value: this.props.type,
                    type: type,
                    variant: this.props.variant
                }),
				React.createElement(C.Effect, {
                    value: this.props.effect,
                    type: type,
                    variant: this.props.variant
                }),
				React.createElement(C.Atk, {
                    value: this.props.atk,
                    variant: this.props.variant
                }),
				React.createElement(C.Def, {
                    value: this.props.def,
                    variant: this.props.variant
                }),

				React.createElement(C.Serial, {
                    value: this.props.serial,
                    variant: this.props.variant
                }),
				React.createElement(C.Id, {
                    value: this.props.id,
                    position: position
                }),
				React.createElement(C.Copyright, {
                    value: isRush ? "" : this.props.copyright
                }),

                React.createElement(C.CardHolo, {
                    rarity: this.props.rarity
                }),
			);

			//return React.createElement(Shared, Object.assign({}, this.props, { border: this.props.pendulum.enabled ? "res/tcg/ygo/border/Effect.pendulum.png" : "res/tcg/ygo/border/Effect.png"}))
		}
	});
	Effect.displayName = "Effect";
    Effect.kind = Kind.Monster;
	Effect.defaultProps = {
        boxSizeEnabled: true,
	};
    Effect.hasPendulum = true;
	return Effect;
});

define('tcg/ygo/layout/Ritual',["react", "react-class", "draw/Group", "./Kind.js", "./component/All"],
function Ritual(React, ReactClass, Group, Kind, C) {
	var Ritual = ReactClass({
		render: function render()
		{
            let isLargePendulum = false;
            this.props.pendulum.boxSizeEnabled = this.props.boxSizeEnabled;
            if(this.props.pendulum.enabled && this.props.boxSizeEnabled) {
                isLargePendulum = this.props.pendulum.boxSize === "Large";
            }
            let isRush = this.props.variant === "Rush";
            let position = isRush ? "rush" : this.props.pendulum.enabled ? "pendulum" : "regular";
            let type = isRush ? "RushMonster" : isLargePendulum ? "LargePendulumMonster" : "Monster";
            if(this.props.variant === "Anime") {
                return React.createElement(
                    Group,
                    this.props,
                    React.createElement(C.Image, { value: this.props.image, pendulum: this.props.pendulum.enabled, rarity: this.props.rarity, variant: this.props.variant }),
                    React.createElement(C.Border, { value: "Ritual", pendulum: this.props.pendulum, variant: this.props.variant }),
                    React.createElement(C.Attribute, { value: this.props.attribute, variant: this.props.variant,  }),
                    React.createElement(C.Pendulum, Object.assign({ variant: this.props.variant }, this.props.pendulum)),
                    React.createElement(C.CardHolo, { rarity: this.props.rarity }),

    				React.createElement(C.Atk, { value: this.props.atk, variant: this.props.variant }),
    				React.createElement(C.Def, { value: this.props.def, variant: this.props.variant }),

                    React.createElement(C.Level, { value: this.props.level, star: "Normal", variant: this.props.variant }),
                );
            }
			return React.createElement(
				Group,
				this.props,
                React.createElement(C.Image, {
					value: this.props.image,
                    pendulum: this.props.pendulum.enabled,
                    rarity: this.props.rarity,
                    variant: this.props.variant
				}),
				React.createElement(C.Border, {
					value: "Ritual",
                    pendulum: this.props.pendulum,
                    variant: this.props.variant
				}),
				React.createElement(C.CardName, {
					value: this.props.name,
                    rarity: this.props.rarity,
                    variant: this.props.variant
				}),
				React.createElement(C.Attribute, {
					value: this.props.attribute,
                    variant: this.props.variant
				}),
				React.createElement(C.Level, {
					value: this.props.level,
                    star: "Normal",
                    variant: this.props.variant
				}),

				React.createElement(C.Pendulum, isRush ? {} : this.props.pendulum),

				React.createElement(C.Type, {
					value: this.props.type,
                    type: type,
                    variant: this.props.variant
				}),
				React.createElement(C.Effect, {
					value: this.props.effect,
                    type: type,
                    variant: this.props.variant
				}),
				React.createElement(C.Atk, {
					value: this.props.atk,
                    variant: this.props.variant
				}),
				React.createElement(C.Def, {
					value: this.props.def,
                    variant: this.props.variant
				}),

				React.createElement(C.Serial, {
					value: this.props.serial,
                    variant: this.props.variant
				}),
				React.createElement(C.Id, {
					value: this.props.id,
                    position: position
				}),
				React.createElement(C.Copyright, {
					value: isRush ? "" : this.props.copyright
				}),

                React.createElement(C.CardHolo, {
					rarity: this.props.rarity
				}),
			);
		}
	});
	Ritual.displayName = "Ritual";
    Ritual.kind = Kind.Monster;
	Ritual.defaultProps = {
        boxSizeEnabled: true,
	};
    Ritual.hasPendulum = true;
	return Ritual;
});

define('tcg/ygo/layout/Fusion',["react", "react-class", "draw/Group", "./Kind.js", "./component/All"],
function Fusion(React, ReactClass, Group, Kind, C) {
	var Fusion = ReactClass({
		render: function render()
		{
            let isLargePendulum = false;
            this.props.pendulum.boxSizeEnabled = this.props.boxSizeEnabled;
            if(this.props.pendulum.enabled && this.props.boxSizeEnabled) {
                isLargePendulum = this.props.pendulum.boxSize === "Large";
            }
            let isRush = this.props.variant === "Rush";
            let position = isRush ? "rush" : this.props.pendulum.enabled ? "pendulum" : "regular";
            let type = isRush ? "RushMonster" : isLargePendulum ? "LargePendulumMonster" : "Monster";
            if(this.props.variant === "Anime") {
                return React.createElement(
                    Group,
                    this.props,
                    React.createElement(C.Image, { value: this.props.image, pendulum: this.props.pendulum.enabled, rarity: this.props.rarity, variant: this.props.variant }),
                    React.createElement(C.Border, { value: "Fusion", pendulum: this.props.pendulum, variant: this.props.variant }),
                    React.createElement(C.Attribute, { value: this.props.attribute, variant: this.props.variant,  }),
                    React.createElement(C.Pendulum, Object.assign({ variant: this.props.variant }, this.props.pendulum)),
                    React.createElement(C.CardHolo, { rarity: this.props.rarity }),

    				React.createElement(C.Atk, { value: this.props.atk, variant: this.props.variant }),
    				React.createElement(C.Def, { value: this.props.def, variant: this.props.variant }),

                    React.createElement(C.Level, { value: this.props.level, star: "Normal", variant: this.props.variant }),
                );
            }
			return React.createElement(
				Group,
				this.props,
				React.createElement(C.Image, {
					value: this.props.image,
                    pendulum: this.props.pendulum.enabled,
                    rarity: this.props.rarity,
                    variant: this.props.variant
				}),
				React.createElement(C.Border, {
					value: "Fusion",
                    pendulum: this.props.pendulum,
                    variant: this.props.variant
				}),
				React.createElement(C.CardName, {
					value: this.props.name,
                    rarity: this.props.rarity,
                    variant: this.props.variant
				}),
				React.createElement(C.Attribute, {
					value: this.props.attribute,
                    variant: this.props.variant
				}),
				React.createElement(C.Level, {
					value: this.props.level,
                    star: "Normal",
                    variant: this.props.variant
				}),

				React.createElement(C.Pendulum, isRush ? {} : this.props.pendulum),

				React.createElement(C.Type, {
					value: this.props.type,
                    type: type,
                    variant: this.props.variant
				}),
				React.createElement(C.Effect, {
					value: this.props.effect,
                    type: type,
                    variant: this.props.variant
				}),
				React.createElement(C.Atk, {
					value: this.props.atk,
                    variant: this.props.variant
				}),
				React.createElement(C.Def, {
					value: this.props.def,
                    variant: this.props.variant
				}),

				React.createElement(C.Serial, {
					value: this.props.serial,
                    variant: this.props.variant
				}),
				React.createElement(C.Id, {
                    value: this.props.id,
                    position: position
                }),
				React.createElement(C.Copyright, {
					value: isRush ? "" : this.props.copyright
				}),

                React.createElement(C.CardHolo, {
					rarity: this.props.rarity
				}),
			);

			//return React.createElement(Shared, Object.assign({}, this.props, { border: this.props.pendulum.enabled ? "res/tcg/ygo/border/Fusion.pendulum.png" : "res/tcg/ygo/border/Fusion.png"}))
		}
	});
	Fusion.displayName = "Fusion";
    Fusion.kind = Kind.Monster;
	Fusion.defaultProps = {
        boxSizeEnabled: true,
	};
    Fusion.hasPendulum = true;
	return Fusion;
});

define('tcg/ygo/layout/Synchro',["react", "react-class", "draw/Group", "./Kind.js", "./component/All"],
function Synchro(React, ReactClass, Group, Kind, C) {
	var Synchro = ReactClass({
		render: function render()
		{
            let isLargePendulum = false;
            this.props.pendulum.boxSizeEnabled = this.props.boxSizeEnabled;
            if(this.props.pendulum.enabled && this.props.boxSizeEnabled) {
                isLargePendulum = this.props.pendulum.boxSize === "Large";
            }
            let isRush = this.props.variant === "Rush";
            let position = isRush ? "rush" : this.props.pendulum.enabled ? "pendulum" : "regular";
            let type = isRush ? "RushMonster" : isLargePendulum ? "LargePendulumMonster" : "Monster";
            if(this.props.variant === "Anime") {
                return React.createElement(
                    Group,
                    this.props,
                    React.createElement(C.Image, { value: this.props.image, pendulum: this.props.pendulum.enabled, rarity: this.props.rarity, variant: this.props.variant }),
                    React.createElement(C.Border, { value: "Synchro", pendulum: this.props.pendulum, variant: this.props.variant }),
                    React.createElement(C.Attribute, { value: this.props.attribute, variant: this.props.variant,  }),
                    React.createElement(C.Pendulum, Object.assign({ variant: this.props.variant }, this.props.pendulum)),
                    React.createElement(C.CardHolo, { rarity: this.props.rarity }),

    				React.createElement(C.Atk, { value: this.props.atk, variant: this.props.variant }),
    				React.createElement(C.Def, { value: this.props.def, variant: this.props.variant }),

                    React.createElement(C.Level, { value: this.props.level, star: "Normal", variant: this.props.variant }),
                );
            }
            return React.createElement(
				Group,
				this.props,
				React.createElement(C.Image, {
					value: this.props.image,
                    pendulum: this.props.pendulum.enabled,
                    rarity: this.props.rarity,
                    variant: this.props.variant
				}),
				React.createElement(C.Border, {
					value: "Synchro",
                    pendulum: this.props.pendulum,
                    variant: this.props.variant
				}),
				React.createElement(C.CardName, {
					value: this.props.name,
                    rarity: this.props.rarity,
                    variant: this.props.variant
				}),
				React.createElement(C.Attribute, {
					value: this.props.attribute,
                    variant: this.props.variant
				}),
				React.createElement(C.Level, {
					value: this.props.level,
                    star: "Normal",
                    variant: this.props.variant
				}),

				React.createElement(C.Pendulum, isRush ? {} : this.props.pendulum),

				React.createElement(C.Type, {
					value: this.props.type,
                    type: type,
                    variant: this.props.variant
				}),
				React.createElement(C.Effect, {
					value: this.props.effect,
                    type: type,
                    variant: this.props.variant
				}),
				React.createElement(C.Atk, {
					value: this.props.atk,
                    variant: this.props.variant
				}),
				React.createElement(C.Def, {
					value: this.props.def,
                    variant: this.props.variant
				}),

				React.createElement(C.Serial, {
					value: this.props.serial,
                    variant: this.props.variant
				}),
				React.createElement(C.Id, {
					value: this.props.id,
                    position: position
				}),
				React.createElement(C.Copyright, {
                    value: isRush ? "" : this.props.copyright
				}),

                React.createElement(C.CardHolo, {
					rarity: this.props.rarity
				}),
			);
		}
	});
	Synchro.displayName = "Synchro";
    Synchro.kind = Kind.Monster;
	Synchro.defaultProps = {
        boxSizeEnabled: true,
	};
    Synchro.hasPendulum = true;
	return Synchro;
});

define('tcg/ygo/layout/DarkSynchro',["react", "react-class", "draw/Group", "./Kind.js", "./component/All"],
function DarkSynchro(React, ReactClass, Group, Kind, C) {
	var DarkSynchro = ReactClass({
		render: function render()
		{
            this.props.pendulum.boxSizeEnabled = this.props.boxSizeEnabled;
            if(this.props.variant === "Anime") {
                return React.createElement(
                    Group,
                    this.props,
                    React.createElement(C.Image, { value: this.props.image, pendulum: this.props.pendulum.enabled, rarity: this.props.rarity, variant: this.props.variant }),
                    React.createElement(C.Border, { value: "DarkSynchro", pendulum: this.props.pendulum, variant: this.props.variant }),
                    React.createElement(C.Attribute, { value: this.props.attribute, variant: this.props.variant,  }),
                    React.createElement(C.Pendulum, Object.assign({ variant: this.props.variant }, this.props.pendulum)),
                    React.createElement(C.CardHolo, { rarity: this.props.rarity }),

                    React.createElement(C.Atk, { value: this.props.atk, variant: this.props.variant }),
                    React.createElement(C.Def, { value: this.props.def, variant: this.props.variant }),

                    React.createElement(C.Level, { value: -this.props.level, star: "Negative", variant: this.props.variant }),
                );
            }
			return React.createElement(
				Group,
				this.props,
				React.createElement(C.Image, {
					value: this.props.image, pendulum: this.props.pendulum.enabled, rarity: this.props.rarity
				}),
				React.createElement(C.Border, {
					value: "DarkSynchro", pendulum: this.props.pendulum
				}),
				React.createElement(C.CardName, {
					value: this.props.name, color: "white", rarity: this.props.rarity
				}),
				React.createElement(C.Attribute, {
					value: this.props.attribute
				}),
				React.createElement(C.Level, {
					value: -this.props.level, star: "Negative"
				}),

				React.createElement(C.Pendulum, this.props.pendulum),

				React.createElement(C.Type, {
					value: this.props.type
				}),
				React.createElement(C.Effect, {
					value: this.props.effect
				}),
				React.createElement(C.Atk, {
					value: this.props.atk
				}),
				React.createElement(C.Def, {
					value: this.props.def
				}),

				React.createElement(C.Serial, {
					value: this.props.serial, color: this.props.pendulum.enabled ? undefined : "black"
				}),
				React.createElement(C.Id, {
					value: this.props.id, position: this.props.pendulum.enabled ? "pendulum" : "regular", color: this.props.pendulum.enabled ? undefined : "black"
				}),
				React.createElement(C.Copyright, {
					value: this.props.copyright, color: this.props.pendulum.enabled ? undefined : "black"
				}),

                React.createElement(C.CardHolo, {
					rarity: this.props.rarity
				}),
			);
		}
	});
	DarkSynchro.displayName = "DarkSynchro";
    DarkSynchro.kind = Kind.Monster;
	DarkSynchro.defaultProps = {
        boxSizeEnabled: false,
	};
    DarkSynchro.hasPendulum = false;
    DarkSynchro.variants = [ "Normal", "Anime" ];
	return DarkSynchro;
});

define('tcg/ygo/layout/Unity',["react", "react-class", "draw/Group", "./Kind.js", "./component/All"],
function Unity(React, ReactClass, Group, Kind, C) {
	var Unity = ReactClass({
		render: function render()
		{
			return React.createElement(
				Group,
				this.props,
				React.createElement(C.Image, {
					value: this.props.image,
                    pendulum: true,
                    rarity: this.props.rarity
				}),
				React.createElement(C.Border, {
                    value: "Unity",
                    pendulum: { enabled: true }
                }),
				React.createElement(C.CardName, {
					value: this.props.name,
                    rarity: this.props.rarity
				}),
				React.createElement(C.Attribute, {
					value: this.props.attribute
				}),
				React.createElement(C.Level, {
					value: this.props.level, star: "Normal"
				}),

				React.createElement(C.Pendulum, Object.assign({}, this.props.pendulum, {
					enabled: true
				})),

				React.createElement(C.Type, {
					value: this.props.type
				}),
				React.createElement(C.Effect, {
					value: this.props.effect
				}),
				React.createElement(C.Atk, {
					value: this.props.atk
				}),
				React.createElement(C.Def, {
					value: this.props.def
				}),

				React.createElement(C.Serial, {
					value: this.props.serial
				}),
				React.createElement(C.Id, {
					value: this.props.id,
                    position: "pendulum"
				}),
				React.createElement(C.Copyright, {
					value: this.props.copyright
				}),

                React.createElement(C.CardHolo, {
					rarity: this.props.rarity
				}),
			);
		}
	});
	Unity.displayName = "Unity";
    Unity.kind = Kind.Monster;
	Unity.defaultProps = {
	};
    Unity.variants = [ "Normal" ];
    Unity.hasPendulum = true;
	return Unity;
});

define('tcg/ygo/layout/Xyz',["react", "react-class", "draw/Group", "./Kind.js", "./component/All"],
function Xyz(React, ReactClass, Group, Kind, C) {
	var Xyz = ReactClass({
		render: function render()
		{
            let isLargePendulum = false;
            this.props.pendulum.boxSizeEnabled = this.props.boxSizeEnabled;
            if(this.props.pendulum.enabled && this.props.boxSizeEnabled) {
                isLargePendulum = this.props.pendulum.boxSize === "Large";
            }
            let isRush = this.props.variant === "Rush";
            let position = isRush ? "rush" : this.props.pendulum.enabled ? "pendulum" : "regular";
            let type = isRush ? "RushMonster" : isLargePendulum ? "LargePendulumMonster" : "Monster";
            if(this.props.variant === "Anime") {
                return React.createElement(
                    Group,
                    this.props,
                    React.createElement(C.Image, { value: this.props.image, pendulum: this.props.pendulum.enabled, rarity: this.props.rarity, variant: this.props.variant }),
                    React.createElement(C.Border, { value: "Xyz", pendulum: this.props.pendulum, variant: this.props.variant }),
                    React.createElement(C.Attribute, { value: this.props.attribute, variant: this.props.variant,  }),
                    React.createElement(C.Pendulum, Object.assign({ variant: this.props.variant }, this.props.pendulum)),
                    React.createElement(C.CardHolo, { rarity: this.props.rarity }),

    				React.createElement(C.Atk, { value: this.props.atk, variant: this.props.variant }),
    				React.createElement(C.Def, { value: this.props.def, variant: this.props.variant }),

                    React.createElement(C.Level, { value: -this.props.level, star: "Xyz", variant: this.props.variant }),
                );
            }
			return React.createElement(
				Group,
				this.props,
				React.createElement(C.Image, {
					value: this.props.image,
                    pendulum: this.props.pendulum.enabled,
                    rarity: this.props.rarity,
                    variant: this.props.variant
				}),
				React.createElement(C.Border, {
					value: "Xyz",
                    pendulum: this.props.pendulum,
                    variant: this.props.variant
				}),
				React.createElement(C.CardName, {
					value: this.props.name,
                    color: "white",
                    rarity: this.props.rarity,
                    variant: this.props.variant
				}),
				React.createElement(C.Attribute, {
					value: this.props.attribute,
                    variant: this.props.variant
				}),
				React.createElement(C.Level, {
					value: -this.props.level,
                    star: "Xyz",
                    variant: this.props.variant
				}),

				React.createElement(C.Pendulum, isRush ? {} : this.props.pendulum),

				React.createElement(C.Type, {
					value: this.props.type,
                    type: type,
                    color: isRush ? "white" : undefined,
                    variant: this.props.variant
				}),
				React.createElement(C.Effect, {
					value: this.props.effect,
                    type: type,
                    variant: this.props.variant
				}),
				React.createElement(C.Atk, {
					value: this.props.atk,
                    variant: this.props.variant
				}),
				React.createElement(C.Def, {
					value: this.props.def,
                    variant: this.props.variant
				}),

				React.createElement(C.Serial, {
					value: this.props.serial,
                    color: this.props.pendulum.enabled ? undefined : "white",
                    variant: this.props.variant
				}),
				React.createElement(C.Id, {
					value: this.props.id,
                    position: position,
                    color: this.props.pendulum.enabled ? undefined : "white",
                    variant: this.props.variant
				}),
				React.createElement(C.Copyright, {
					value: isRush ? "" : this.props.copyright,
                    color: this.props.pendulum.enabled ? undefined : "white"
				}),

                React.createElement(C.CardHolo, {
					rarity: this.props.rarity
				}),
			);
		}
	});
	Xyz.displayName = "Xyz";
    Xyz.kind = Kind.Monster;
	Xyz.defaultProps = {
        boxSizeEnabled: true,
	};
    Xyz.levelName = "Rank";
    Xyz.hasPendulum = true;
	return Xyz;
});

define('tcg/ygo/layout/Link',["react", "react-class", "draw/Group", "./Kind.js", "./component/All"],
function Link(React, ReactClass, Group, Kind, C) {
	var Link = ReactClass({
		render: function render()
		{
            if(this.props.variant === "Anime") {
                return React.createElement(
                    Group,
                    this.props,
                    React.createElement(C.Image, { value: this.props.image, pendulum: this.props.pendulum.enabled, rarity: this.props.rarity, variant: this.props.variant }),
                    React.createElement(C.Border, { value: "Link", pendulum: this.props.pendulum, variant: this.props.variant }),
                    React.createElement(C.Attribute, { value: this.props.attribute, variant: this.props.variant,  }),
                    React.createElement(C.Pendulum, Object.assign({ variant: this.props.variant }, this.props.pendulum)),
                    React.createElement(C.CardHolo, { rarity: this.props.rarity }),

                    React.createElement(C.Atk, { value: this.props.atk, variant: this.props.variant }),
                    React.createElement(C.Def, { value: "L-" + this.props.def, variant: this.props.variant }),

                    // React.createElement(C.Link, { value: this.props.def }),
    				React.createElement(C.LinkMarkers, Object.assign({pendulum: this.props.pendulum.enabled, variant: this.props.variant }, this.props.link) ),
                );
            }
			return React.createElement(
				Group,
				this.props,
				React.createElement(C.Image, {
					value: this.props.image,
                    pendulum: this.props.pendulum.enabled,
                    rarity: this.props.rarity,
                    variant: this.props.variant
				}),
				React.createElement(C.Border, {
					value: "Link",
                    pendulum: this.props.pendulum,
                    variant: this.props.variant
				}),
				React.createElement(C.CardName, {
					value: this.props.name,
                    color: "white",
                    rarity: this.props.rarity,
                    variant: this.props.variant
				}),
				React.createElement(C.Attribute, {
					value: this.props.attribute,
                    variant: this.props.variant
				}),

				React.createElement(C.LinkMarkers, Object.assign(
                    {
                        pendulum: this.props.pendulum.enabled,
                        variant: this.props.variant
                    },
                    this.props.link
                )),
				React.createElement(C.Pendulum, this.props.pendulum),

				React.createElement(C.Type, {
					value: this.props.type,
                    variant: this.props.variant
				}),
				React.createElement(C.Effect, {
					value: this.props.effect,
                    variant: this.props.variant
				}),
				React.createElement(C.Atk, {
					value: this.props.atk,
                    variant: this.props.variant
				}),
				// Recycle the DEF value as it shouldn't appear at the same time.
				React.createElement(C.Link, {
					value: this.props.def,
                    variant: this.props.variant
				}),

				React.createElement(C.Serial, {
					value: this.props.serial,
                    variant: this.props.variant
				}),
				React.createElement(C.Id, {
                    value: this.props.id,
                    position: this.props.pendulum.enabled ? "pendulum" : "link"
                }),
				React.createElement(C.Copyright, {
					value: this.props.copyright
				}),

                React.createElement(C.CardHolo, {
					rarity: this.props.rarity
				}),
			);

			//return React.createElement(Shared, Object.assign({}, this.props, { border: this.props.pendulum.enabled ? "res/tcg/ygo/border/Link.pendulum.png" : "res/tcg/ygo/border/Link.png"}))
		}
	});
    //
	Link.displayName = "Link";
    Link.kind = [ Kind.Monster, Kind.Link ];
	Link.defaultProps = {
	};
    Link.variants = [ "Normal", "Anime" ];
    Link.hasPendulum = false;
	return Link;
});

define('tcg/ygo/layout/Token',["react", "react-class", "draw/Group", "./Kind.js", "./component/All"],
function Token(React, ReactClass, Group, Kind, C) {
	var Token = ReactClass({
		render: function render()
		{
            let isLargePendulum = false;
            this.props.pendulum.boxSizeEnabled = this.props.boxSizeEnabled;
            if(this.props.pendulum.enabled && this.props.boxSizeEnabled) {
                isLargePendulum = this.props.pendulum.boxSize === "Large";
            }
            let isRush = this.props.variant === "Rush";
            let position = isRush ? "rush" : this.props.pendulum.enabled ? "pendulum" : "regular";
            let type = isRush ? "RushMonster" : isLargePendulum ? "LargePendulumMonster" : "Monster";
            if(this.props.variant === "Anime") {
                return React.createElement(
                    Group,
                    this.props,
                    React.createElement(C.Image, { value: this.props.image, pendulum: this.props.pendulum.enabled, rarity: this.props.rarity, variant: this.props.variant }),
                    React.createElement(C.Border, { value: "Token", pendulum: this.props.pendulum,  variant: this.props.variant, }),
                    React.createElement(C.Attribute, { value: this.props.attribute, variant: this.props.variant, }),
                    React.createElement(C.Pendulum, Object.assign({ variant: this.props.variant }, this.props.pendulum)),
                    React.createElement(C.CardHolo, { rarity: this.props.rarity }),

    				React.createElement(C.Atk, { value: this.props.atk, variant: this.props.variant }),
    				React.createElement(C.Def, { value: this.props.def, variant: this.props.variant }),

                    React.createElement(C.Level, { value: this.props.level, star: "Normal", variant: this.props.variant }),
                );
            }
			return React.createElement(
				Group,
				this.props,
				React.createElement(C.Image, {
					value: this.props.image,
                    pendulum: this.props.pendulum.enabled,
                    rarity: this.props.rarity,
                    variant: this.props.variant
				}),
				React.createElement(C.Border, {
					value: "Token",
                    pendulum: this.props.pendulum.enabled,
                    variant: this.props.variant
				}),
				React.createElement(C.CardName, {
					value: this.props.name,
                    rarity: this.props.rarity,
                    variant: this.props.variant
				}),
				React.createElement(C.Attribute, {
					value: this.props.attribute,
                    variant: this.props.variant
				}),
				React.createElement(C.Level, {
					value: this.props.level,
                    star: "Normal",
                    variant: this.props.variant
				}),

				React.createElement(C.Pendulum, isRush ? {} : this.props.pendulum),

				React.createElement(C.Type, {
					value: this.props.type,
                    variant: this.props.variant
				}),
				React.createElement(C.Effect, {
					value: this.props.effect,
                    type: type,
                    variant: this.props.variant
				}),
				React.createElement(C.Atk, {
					value: this.props.atk,
                    variant: this.props.variant
				}),
				React.createElement(C.Def, {
					value: this.props.def,
                    variant: this.props.variant
				}),

				React.createElement(C.Serial, {
					value: this.props.serial,
                    variant: this.props.variant
				}),
				React.createElement(C.Id, {
					value: this.props.id,
                    position: position
				}),
				React.createElement(C.Copyright, {
					value: isRush ? "" : this.props.copyright
				}),

                React.createElement(C.CardHolo, {
					rarity: this.props.rarity
				}),
			);

			//return React.createElement(Shared, Object.assign({}, this.props, { border: this.props.pendulum.enabled ? "res/tcg/ygo/border/Token.pendulum.png" : "res/tcg/ygo/border/Token.png"}))
		}
	});
	Token.displayName = "Token";
    Token.kind = Kind.Monster;
	Token.defaultProps = {
        boxSizeEnabled: false,
	};
    Token.hasPendulum = false;
	return Token;
});

define('tcg/ygo/layout/Spell',["react", "react-class", "draw/Group", "./Kind.js", "./component/All"],
function Spell(React, ReactClass, Group, Kind, C) {
	var Spell = ReactClass({
		render: function render()
		{
            this.props.pendulum.boxSizeEnabled = this.props.boxSizeEnabled;
            if(this.props.variant === "Anime") {
    			return React.createElement(
    				Group,
    				this.props,
    				React.createElement(C.Image, { value: this.props.image, pendulum: this.props.pendulum.enabled, rarity: this.props.rarity, variant: this.props.variant }),
    				React.createElement(C.Border, { value: "Spell", pendulum: this.props.pendulum, variant: this.props.variant }),
    				React.createElement(C.Attribute, { value: this.props.attribute, variant: this.props.variant, backrow: true, }),
    				React.createElement(C.Pendulum, Object.assign({ variant: this.props.variant }, this.props.pendulum)),
                    React.createElement(C.CardHolo, { rarity: this.props.rarity }),
    			);
            }
            let isRush = this.props.variant === "Rush";
            let color = isRush ? "black" : "white";
            let position = isRush ? "rush" : this.props.pendulum.enabled ? "pendulum" : "regular";
			return React.createElement(
				Group,
				this.props,
				React.createElement(C.Image, {
                    value: this.props.image,
                    pendulum: this.props.pendulum.enabled,
                    rarity: this.props.rarity,
                    variant: this.props.variant
                }),
				React.createElement(C.Border, {
                    value: "Spell",
                    pendulum: this.props.pendulum,
                    variant: this.props.variant
                }),
				React.createElement(C.CardName, {
                    value: this.props.name,
                    color: color,
                    rarity: this.props.rarity,
                    variant: this.props.variant
                }),
				React.createElement(C.Attribute, {
                    value: this.props.attribute,
                    variant: this.props.variant
                }),

				React.createElement(C.Pendulum, isRush ? {} : this.props.pendulum),

				React.createElement(C.Type, {
                    value: this.props.type,
                    type: "Backrow",
                    icon: this.props.icon,
                    variant: this.props.variant,
                }),
				React.createElement(C.Effect, {
                    value: this.props.effect,
                    type: isRush ? "RushBackrow" : "Backrow"
                }),

				React.createElement(C.Serial, {
                    value: this.props.serial,
                    variant: this.props.variant
                }),
				React.createElement(C.Id, { value: this.props.id, position: position }),
				React.createElement(C.Copyright, { value: isRush ? "" : this.props.copyright }),

                React.createElement(C.CardHolo, { rarity: this.props.rarity }),
			);
		}
	});
	Spell.displayName = "Spell";
    Spell.kind = Kind.Backrow;
	Spell.defaultProps = {
        boxSizeEnabled: false,
	};
    Spell.hasPendulum = true;
	return Spell;
});

define('tcg/ygo/layout/Trap',["react", "react-class", "draw/Group", "./Kind.js", "./component/All"],
function Trap(React, ReactClass, Group, Kind, C) {
	var Trap = ReactClass({
		render: function render()
		{
            this.props.pendulum.boxSizeEnabled = this.props.boxSizeEnabled;
            if(this.props.variant === "Anime") {
                return React.createElement(
                    Group,
                    this.props,
                    React.createElement(C.Image, { value: this.props.image, pendulum: this.props.pendulum.enabled, rarity: this.props.rarity, variant: this.props.variant }),
                    React.createElement(C.Border, { value: "Trap", pendulum: this.props.pendulum, variant: this.props.variant }),
                    React.createElement(C.Attribute, { value: this.props.attribute, variant: this.props.variant, backrow: true,  }),
                    React.createElement(C.Pendulum, Object.assign({ variant: this.props.variant }, this.props.pendulum)),
                    React.createElement(C.CardHolo, { rarity: this.props.rarity }),
                );
            }
            let isRush = this.props.variant === "Rush";
            let color = isRush ? "black" : "white";
            let position = isRush ? "rush" : this.props.pendulum.enabled ? "pendulum" : "regular";
			return React.createElement(
				Group,
				this.props,
				React.createElement(C.Image, {
                    value: this.props.image,
                    pendulum: this.props.pendulum.enabled,
                    rarity: this.props.rarity,
                    variant: this.props.variant
                }),
				React.createElement(C.Border, {
                    value: "Trap",
                    pendulum: this.props.pendulum.enabled,
                    variant: this.props.variant
                }),
				React.createElement(C.CardName, {
                    value: this.props.name,
                    color: color,
                    rarity: this.props.rarity,
                    variant: this.props.variant
                }),
				React.createElement(C.Attribute, {
                    value: this.props.attribute,
                    variant: this.props.variant
                }),

				React.createElement(C.Pendulum, isRush ? {} : this.props.pendulum),

				React.createElement(C.Type, {
                    value: this.props.type,
                    type: "Backrow",
                    icon: this.props.icon,
                    variant: this.props.variant
                }),
				React.createElement(C.Effect, {
                    value: this.props.effect,
                    type: isRush ? "RushBackrow" : "Backrow"
                }),

				React.createElement(C.Serial, {
                    value: this.props.serial,
                    variant: this.props.variant
                }),
				React.createElement(C.Id, { value: this.props.id, position: position }),
				React.createElement(C.Copyright, { value: isRush ? "" : this.props.copyright }),

                React.createElement(C.CardHolo, { rarity: this.props.rarity }),
			);
		}
	});
	Trap.displayName = "Trap";
    Trap.kind = Kind.Backrow;
	Trap.defaultProps = {
        boxSizeEnabled: false,
	};
    Trap.hasPendulum = false;
	return Trap;
});

define('tcg/ygo/layout/Skill',["react", "react-class", "draw/Group", "./Kind.js", "./component/All"],
function Skill(React, ReactClass, Group, Kind, C) {
	var Skill = ReactClass({
		render: function render()
		{
			return React.createElement(
				Group,
				this.props,
				React.createElement(C.Image, {
					value: this.props.image, rarity: this.props.rarity
				}),
				React.createElement(C.Border, {
					value: "Skill"
				}),
				React.createElement(C.CardName, {
					value: this.props.name, color: "white", rarity: this.props.rarity, type: "skill"
				}),

				React.createElement(C.Type, {
					value: this.props.type
				}),
				React.createElement(C.Effect, {
					value: this.props.effect, type: "Skill"
				}),

				React.createElement(C.Serial, {
					value: this.props.serial, color: "white"
				}),
				React.createElement(C.Id, {
					value: this.props.id, position: "regular", color: "white"
				}),
				React.createElement(C.Copyright, {
					value: this.props.copyright, color: "white"
				}),

                React.createElement(C.CardHolo, {
					rarity: this.props.rarity
				}),
			);
		}
	});
	Skill.displayName = "Skill";
    Skill.kind = Kind.Skill;
	Skill.defaultProps = {

	};
    Skill.variants = [ "Normal" ];
    Skill.hasPendulum = false;
	return Skill;
});

// TODO: stance attributes
define('tcg/ygo/layout/Rainbow',["react", "react-class", "draw/Group", "./Kind.js", "./component/All"],
function Rainbow(React, ReactClass, Group, Kind, C) {
	var Rainbow = ReactClass({
		render: function render()
		{
            let isLargePendulum = false;
            this.props.pendulum.boxSizeEnabled = this.props.boxSizeEnabled;
            if(this.props.pendulum.enabled && this.props.boxSizeEnabled) {
                isLargePendulum = this.props.pendulum.boxSize === "Large";
            }
            let isRush = this.props.variant === "Rush";
            let position = isRush ? "rush" : this.props.pendulum.enabled ? "pendulum" : "regular";
            let type = isRush ? "RushMonster" : isLargePendulum ? "LargePendulumMonster" : "Monster";
            if(this.props.variant === "Anime") {
                return React.createElement(
                    Group,
                    this.props,
                    React.createElement(C.Image, { value: this.props.image, pendulum: this.props.pendulum.enabled, rarity: this.props.rarity, variant: this.props.variant }),
                    React.createElement(C.Border, { value: "Rainbow", pendulum: this.props.pendulum,  variant: this.props.variant, }),
                    React.createElement(C.Attribute, { value: this.props.attribute, variant: this.props.variant, }),
                    React.createElement(C.Pendulum, Object.assign({ variant: this.props.variant }, this.props.pendulum)),
                    React.createElement(C.CardHolo, { rarity: this.props.rarity }),

    				React.createElement(C.Atk, { value: this.props.atk, variant: this.props.variant }),
    				React.createElement(C.Def, { value: this.props.def, variant: this.props.variant }),

                    React.createElement(C.Level, { value: -this.props.level, star: "Rainbow", variant: this.props.variant }),
                );
            }
			return React.createElement(
				Group,
				this.props,
				React.createElement(C.Image, {
					value: this.props.image,
                    pendulum: this.props.pendulum.enabled,
                    rarity: this.props.rarity,
                    variant: this.props.variant
				}),
				React.createElement(C.Border, {
					value: "Rainbow",
                    pendulum: this.props.pendulum,
                    variant: this.props.variant
				}),
				// React.createElement(C.Border, {
			    //       value: "Rainbow", pendulum: false
				// }),
				React.createElement(C.CardName, {
					value: this.props.name,
                    rarity: this.props.rarity,
                    variant: this.props.variant
				}),
				React.createElement(C.Attribute, {
					value: this.props.attribute,
                    variant: this.props.variant
				}),
				React.createElement(C.Level, {
					value: -this.props.level,
                    star: "Rainbow",
                    variant: this.props.variant
				}),

				React.createElement(C.Pendulum, isRush ? {} : this.props.pendulum),

				React.createElement(C.Type, {
					value: this.props.type,
                    type: type,
                    variant: this.props.variant
				}),
				React.createElement(C.Effect, {
					value: this.props.effect,
                    type: type,
                    variant: this.props.variant
				}),
				React.createElement(C.Atk, {
					value: this.props.atk,
                    variant: this.props.variant
				}),
				React.createElement(C.Def, {
					value: this.props.def,
                    variant: this.props.variant
				}),

				React.createElement(C.Serial, {
					value: this.props.serial,
                    variant: this.props.variant
				}),
				React.createElement(C.Id, {
					value: this.props.id,
                    position: position,
                    color: "white"
				}),
				React.createElement(C.Copyright, {
					value: isRush ? "" : this.props.copyright
				}),

                React.createElement(C.CardHolo, {
					rarity: this.props.rarity
				}),
			);
		}
	});
	Rainbow.displayName = "Rainbow";
    Rainbow.kind = Kind.Monster;
	Rainbow.defaultProps = {
        boxSizeEnabled: true,
	};
    Rainbow.levelName = "Tier";
    // Rainbow.
	return Rainbow;
});

define('tcg/ygo/layout/All',[
	"./Normal",
	"./Effect",
	"./Ritual",
	"./Fusion",
	"./Synchro",
	"./DarkSynchro",
	// "./Epoch",
	// "./Warp",
	"./Unity",
	"./Xyz",
	"./Link",
	"./Token",
	"./Spell",
	"./Trap",
	"./Skill",
	"./Rainbow",
],
function ygo_template_all(Normal, Effect, Ritual, Fusion, Synchro, DarkSynchro, Epoch, Warp, Unity, Xyz, Link, Token, Spell, Trap, Skill, Rainbow)
{
	return {
		Normal: { value: "Normal", fn: Normal },
		Effect: { value: "Effect", fn: Effect },
		Ritual: { value: "Ritual", fn: Ritual },
		Fusion: { value: "Fusion", fn: Fusion },
		Synchro: { value: "Synchro", fn:Synchro },
        Xyz: { value: "Xyz", fn: Xyz },
		Link: { value: "Link", fn: Link },
		Token: { value: "Token", fn: Token },
		Spell: { value: "Spell", fn: Spell },
		Trap: { value: "Trap", fn: Trap },
		Skill: { value: "Skill", fn: Skill },
		DarkSynchro: { value: "DarkSynchro", name: "Dark Synchro", fn: DarkSynchro },
		// Epoch: { value: "Epoch", name: "Bigbang", fn: Epoch },
		// Warp: { value: "Warp", name: "Time Leap", fn: Warp },
		Unity: { value: "Unity", fn: Unity },
		Rainbow: { value: "Rainbow", fn: Rainbow },
	};
});

define('tcg/ygo/Card',["react", "react-class", "draw/Canvas", "./layout/All", "./layout/Kind.js", "./Attributes", "./Stars", "./Icons", "./Rarities"],
function App(React, ReactClass, Canvas, Layouts, Kind, Attributes, Stars, Icons, Rarities)
{
	var Card = ReactClass({
		render: function render()
		{
			return React.createElement(
				Canvas,
				{
					width: 421,
					height: 614,
					className: "ygo card",
				},
				React.createElement(
					Layouts[this.props.layout].fn,
					this.props
				)
			);
		}
	});
	Card.defaultProps = { layout: "Normal" };
	Card.displayName = "Card";
	Card.Layout = Layouts;
    Card.Kind = Kind;
	Card.Attributes = Attributes;
	Card.Stars = Stars;
	Card.Icons = Icons;
	Card.Rarities = Rarities;
    Card.BoxSizes = {
        "Small": "Small",
        "Normal": "Normal",
        "Large": "Large"
    };
    Card.StyleVariants = {
        "Normal": "Normal",
        "Anime": "Anime",
        "Rush": "Rush",
    };
	return Card;
});

/* Web Font Loader v1.6.28 - (c) Adobe Systems, Google. License: Apache 2.0 */(function(){function aa(a,b,c){return a.call.apply(a.bind,arguments)}function ba(a,b,c){if(!a)throw Error();if(2<arguments.length){var d=Array.prototype.slice.call(arguments,2);return function(){var c=Array.prototype.slice.call(arguments);Array.prototype.unshift.apply(c,d);return a.apply(b,c)}}return function(){return a.apply(b,arguments)}}function p(a,b,c){p=Function.prototype.bind&&-1!=Function.prototype.bind.toString().indexOf("native code")?aa:ba;return p.apply(null,arguments)}var q=Date.now||function(){return+new Date};function ca(a,b){this.a=a;this.o=b||a;this.c=this.o.document}var da=!!window.FontFace;function t(a,b,c,d){b=a.c.createElement(b);if(c)for(var e in c)c.hasOwnProperty(e)&&("style"==e?b.style.cssText=c[e]:b.setAttribute(e,c[e]));d&&b.appendChild(a.c.createTextNode(d));return b}function u(a,b,c){a=a.c.getElementsByTagName(b)[0];a||(a=document.documentElement);a.insertBefore(c,a.lastChild)}function v(a){a.parentNode&&a.parentNode.removeChild(a)}
function w(a,b,c){b=b||[];c=c||[];for(var d=a.className.split(/\s+/),e=0;e<b.length;e+=1){for(var f=!1,g=0;g<d.length;g+=1)if(b[e]===d[g]){f=!0;break}f||d.push(b[e])}b=[];for(e=0;e<d.length;e+=1){f=!1;for(g=0;g<c.length;g+=1)if(d[e]===c[g]){f=!0;break}f||b.push(d[e])}a.className=b.join(" ").replace(/\s+/g," ").replace(/^\s+|\s+$/,"")}function y(a,b){for(var c=a.className.split(/\s+/),d=0,e=c.length;d<e;d++)if(c[d]==b)return!0;return!1}
function ea(a){return a.o.location.hostname||a.a.location.hostname}function z(a,b,c){function d(){m&&e&&f&&(m(g),m=null)}b=t(a,"link",{rel:"stylesheet",href:b,media:"all"});var e=!1,f=!0,g=null,m=c||null;da?(b.onload=function(){e=!0;d()},b.onerror=function(){e=!0;g=Error("Stylesheet failed to load");d()}):setTimeout(function(){e=!0;d()},0);u(a,"head",b)}
function A(a,b,c,d){var e=a.c.getElementsByTagName("head")[0];if(e){var f=t(a,"script",{src:b}),g=!1;f.onload=f.onreadystatechange=function(){g||this.readyState&&"loaded"!=this.readyState&&"complete"!=this.readyState||(g=!0,c&&c(null),f.onload=f.onreadystatechange=null,"HEAD"==f.parentNode.tagName&&e.removeChild(f))};e.appendChild(f);setTimeout(function(){g||(g=!0,c&&c(Error("Script load timeout")))},d||5E3);return f}return null};function B(){this.a=0;this.c=null}function C(a){a.a++;return function(){a.a--;D(a)}}function E(a,b){a.c=b;D(a)}function D(a){0==a.a&&a.c&&(a.c(),a.c=null)};function F(a){this.a=a||"-"}F.prototype.c=function(a){for(var b=[],c=0;c<arguments.length;c++)b.push(arguments[c].replace(/[\W_]+/g,"").toLowerCase());return b.join(this.a)};function G(a,b){this.c=a;this.f=4;this.a="n";var c=(b||"n4").match(/^([nio])([1-9])$/i);c&&(this.a=c[1],this.f=parseInt(c[2],10))}function fa(a){return H(a)+" "+(a.f+"00")+" 300px "+I(a.c)}function I(a){var b=[];a=a.split(/,\s*/);for(var c=0;c<a.length;c++){var d=a[c].replace(/['"]/g,"");-1!=d.indexOf(" ")||/^\d/.test(d)?b.push("'"+d+"'"):b.push(d)}return b.join(",")}function J(a){return a.a+a.f}function H(a){var b="normal";"o"===a.a?b="oblique":"i"===a.a&&(b="italic");return b}
function ga(a){var b=4,c="n",d=null;a&&((d=a.match(/(normal|oblique|italic)/i))&&d[1]&&(c=d[1].substr(0,1).toLowerCase()),(d=a.match(/([1-9]00|normal|bold)/i))&&d[1]&&(/bold/i.test(d[1])?b=7:/[1-9]00/.test(d[1])&&(b=parseInt(d[1].substr(0,1),10))));return c+b};function ha(a,b){this.c=a;this.f=a.o.document.documentElement;this.h=b;this.a=new F("-");this.j=!1!==b.events;this.g=!1!==b.classes}function ia(a){a.g&&w(a.f,[a.a.c("wf","loading")]);K(a,"loading")}function L(a){if(a.g){var b=y(a.f,a.a.c("wf","active")),c=[],d=[a.a.c("wf","loading")];b||c.push(a.a.c("wf","inactive"));w(a.f,c,d)}K(a,"inactive")}function K(a,b,c){if(a.j&&a.h[b])if(c)a.h[b](c.c,J(c));else a.h[b]()};function ja(){this.c={}}function ka(a,b,c){var d=[],e;for(e in b)if(b.hasOwnProperty(e)){var f=a.c[e];f&&d.push(f(b[e],c))}return d};function M(a,b){this.c=a;this.f=b;this.a=t(this.c,"span",{"aria-hidden":"true"},this.f)}function N(a){u(a.c,"body",a.a)}function O(a){return"display:block;position:absolute;top:-9999px;left:-9999px;font-size:300px;width:auto;height:auto;line-height:normal;margin:0;padding:0;font-variant:normal;white-space:nowrap;font-family:"+I(a.c)+";"+("font-style:"+H(a)+";font-weight:"+(a.f+"00")+";")};function P(a,b,c,d,e,f){this.g=a;this.j=b;this.a=d;this.c=c;this.f=e||3E3;this.h=f||void 0}P.prototype.start=function(){var a=this.c.o.document,b=this,c=q(),d=new Promise(function(d,e){function f(){q()-c>=b.f?e():a.fonts.load(fa(b.a),b.h).then(function(a){1<=a.length?d():setTimeout(f,25)},function(){e()})}f()}),e=null,f=new Promise(function(a,d){e=setTimeout(d,b.f)});Promise.race([f,d]).then(function(){e&&(clearTimeout(e),e=null);b.g(b.a)},function(){b.j(b.a)})};function Q(a,b,c,d,e,f,g){this.v=a;this.B=b;this.c=c;this.a=d;this.s=g||"BESbswy";this.f={};this.w=e||3E3;this.u=f||null;this.m=this.j=this.h=this.g=null;this.g=new M(this.c,this.s);this.h=new M(this.c,this.s);this.j=new M(this.c,this.s);this.m=new M(this.c,this.s);a=new G(this.a.c+",serif",J(this.a));a=O(a);this.g.a.style.cssText=a;a=new G(this.a.c+",sans-serif",J(this.a));a=O(a);this.h.a.style.cssText=a;a=new G("serif",J(this.a));a=O(a);this.j.a.style.cssText=a;a=new G("sans-serif",J(this.a));a=
O(a);this.m.a.style.cssText=a;N(this.g);N(this.h);N(this.j);N(this.m)}var R={D:"serif",C:"sans-serif"},S=null;function T(){if(null===S){var a=/AppleWebKit\/([0-9]+)(?:\.([0-9]+))/.exec(window.navigator.userAgent);S=!!a&&(536>parseInt(a[1],10)||536===parseInt(a[1],10)&&11>=parseInt(a[2],10))}return S}Q.prototype.start=function(){this.f.serif=this.j.a.offsetWidth;this.f["sans-serif"]=this.m.a.offsetWidth;this.A=q();U(this)};
function la(a,b,c){for(var d in R)if(R.hasOwnProperty(d)&&b===a.f[R[d]]&&c===a.f[R[d]])return!0;return!1}function U(a){var b=a.g.a.offsetWidth,c=a.h.a.offsetWidth,d;(d=b===a.f.serif&&c===a.f["sans-serif"])||(d=T()&&la(a,b,c));d?q()-a.A>=a.w?T()&&la(a,b,c)&&(null===a.u||a.u.hasOwnProperty(a.a.c))?V(a,a.v):V(a,a.B):ma(a):V(a,a.v)}function ma(a){setTimeout(p(function(){U(this)},a),50)}function V(a,b){setTimeout(p(function(){v(this.g.a);v(this.h.a);v(this.j.a);v(this.m.a);b(this.a)},a),0)};function W(a,b,c){this.c=a;this.a=b;this.f=0;this.m=this.j=!1;this.s=c}var X=null;W.prototype.g=function(a){var b=this.a;b.g&&w(b.f,[b.a.c("wf",a.c,J(a).toString(),"active")],[b.a.c("wf",a.c,J(a).toString(),"loading"),b.a.c("wf",a.c,J(a).toString(),"inactive")]);K(b,"fontactive",a);this.m=!0;na(this)};
W.prototype.h=function(a){var b=this.a;if(b.g){var c=y(b.f,b.a.c("wf",a.c,J(a).toString(),"active")),d=[],e=[b.a.c("wf",a.c,J(a).toString(),"loading")];c||d.push(b.a.c("wf",a.c,J(a).toString(),"inactive"));w(b.f,d,e)}K(b,"fontinactive",a);na(this)};function na(a){0==--a.f&&a.j&&(a.m?(a=a.a,a.g&&w(a.f,[a.a.c("wf","active")],[a.a.c("wf","loading"),a.a.c("wf","inactive")]),K(a,"active")):L(a.a))};function oa(a){this.j=a;this.a=new ja;this.h=0;this.f=this.g=!0}oa.prototype.load=function(a){this.c=new ca(this.j,a.context||this.j);this.g=!1!==a.events;this.f=!1!==a.classes;pa(this,new ha(this.c,a),a)};
function qa(a,b,c,d,e){var f=0==--a.h;(a.f||a.g)&&setTimeout(function(){var a=e||null,m=d||null||{};if(0===c.length&&f)L(b.a);else{b.f+=c.length;f&&(b.j=f);var h,l=[];for(h=0;h<c.length;h++){var k=c[h],n=m[k.c],r=b.a,x=k;r.g&&w(r.f,[r.a.c("wf",x.c,J(x).toString(),"loading")]);K(r,"fontloading",x);r=null;if(null===X)if(window.FontFace){var x=/Gecko.*Firefox\/(\d+)/.exec(window.navigator.userAgent),xa=/OS X.*Version\/10\..*Safari/.exec(window.navigator.userAgent)&&/Apple/.exec(window.navigator.vendor);
X=x?42<parseInt(x[1],10):xa?!1:!0}else X=!1;X?r=new P(p(b.g,b),p(b.h,b),b.c,k,b.s,n):r=new Q(p(b.g,b),p(b.h,b),b.c,k,b.s,a,n);l.push(r)}for(h=0;h<l.length;h++)l[h].start()}},0)}function pa(a,b,c){var d=[],e=c.timeout;ia(b);var d=ka(a.a,c,a.c),f=new W(a.c,b,e);a.h=d.length;b=0;for(c=d.length;b<c;b++)d[b].load(function(b,d,c){qa(a,f,b,d,c)})};function ra(a,b){this.c=a;this.a=b}
ra.prototype.load=function(a){function b(){if(f["__mti_fntLst"+d]){var c=f["__mti_fntLst"+d](),e=[],h;if(c)for(var l=0;l<c.length;l++){var k=c[l].fontfamily;void 0!=c[l].fontStyle&&void 0!=c[l].fontWeight?(h=c[l].fontStyle+c[l].fontWeight,e.push(new G(k,h))):e.push(new G(k))}a(e)}else setTimeout(function(){b()},50)}var c=this,d=c.a.projectId,e=c.a.version;if(d){var f=c.c.o;A(this.c,(c.a.api||"https://fast.fonts.net/jsapi")+"/"+d+".js"+(e?"?v="+e:""),function(e){e?a([]):(f["__MonotypeConfiguration__"+
d]=function(){return c.a},b())}).id="__MonotypeAPIScript__"+d}else a([])};function sa(a,b){this.c=a;this.a=b}sa.prototype.load=function(a){var b,c,d=this.a.urls||[],e=this.a.families||[],f=this.a.testStrings||{},g=new B;b=0;for(c=d.length;b<c;b++)z(this.c,d[b],C(g));var m=[];b=0;for(c=e.length;b<c;b++)if(d=e[b].split(":"),d[1])for(var h=d[1].split(","),l=0;l<h.length;l+=1)m.push(new G(d[0],h[l]));else m.push(new G(d[0]));E(g,function(){a(m,f)})};function ta(a,b){a?this.c=a:this.c=ua;this.a=[];this.f=[];this.g=b||""}var ua="https://fonts.googleapis.com/css";function va(a,b){for(var c=b.length,d=0;d<c;d++){var e=b[d].split(":");3==e.length&&a.f.push(e.pop());var f="";2==e.length&&""!=e[1]&&(f=":");a.a.push(e.join(f))}}
function wa(a){if(0==a.a.length)throw Error("No fonts to load!");if(-1!=a.c.indexOf("kit="))return a.c;for(var b=a.a.length,c=[],d=0;d<b;d++)c.push(a.a[d].replace(/ /g,"+"));b=a.c+"?family="+c.join("%7C");0<a.f.length&&(b+="&subset="+a.f.join(","));0<a.g.length&&(b+="&text="+encodeURIComponent(a.g));return b};function ya(a){this.f=a;this.a=[];this.c={}}
var za={latin:"BESbswy","latin-ext":"\u00e7\u00f6\u00fc\u011f\u015f",cyrillic:"\u0439\u044f\u0416",greek:"\u03b1\u03b2\u03a3",khmer:"\u1780\u1781\u1782",Hanuman:"\u1780\u1781\u1782"},Aa={thin:"1",extralight:"2","extra-light":"2",ultralight:"2","ultra-light":"2",light:"3",regular:"4",book:"4",medium:"5","semi-bold":"6",semibold:"6","demi-bold":"6",demibold:"6",bold:"7","extra-bold":"8",extrabold:"8","ultra-bold":"8",ultrabold:"8",black:"9",heavy:"9",l:"3",r:"4",b:"7"},Ba={i:"i",italic:"i",n:"n",normal:"n"},
Ca=/^(thin|(?:(?:extra|ultra)-?)?light|regular|book|medium|(?:(?:semi|demi|extra|ultra)-?)?bold|black|heavy|l|r|b|[1-9]00)?(n|i|normal|italic)?$/;
function Da(a){for(var b=a.f.length,c=0;c<b;c++){var d=a.f[c].split(":"),e=d[0].replace(/\+/g," "),f=["n4"];if(2<=d.length){var g;var m=d[1];g=[];if(m)for(var m=m.split(","),h=m.length,l=0;l<h;l++){var k;k=m[l];if(k.match(/^[\w-]+$/)){var n=Ca.exec(k.toLowerCase());if(null==n)k="";else{k=n[2];k=null==k||""==k?"n":Ba[k];n=n[1];if(null==n||""==n)n="4";else var r=Aa[n],n=r?r:isNaN(n)?"4":n.substr(0,1);k=[k,n].join("")}}else k="";k&&g.push(k)}0<g.length&&(f=g);3==d.length&&(d=d[2],g=[],d=d?d.split(","):
g,0<d.length&&(d=za[d[0]])&&(a.c[e]=d))}a.c[e]||(d=za[e])&&(a.c[e]=d);for(d=0;d<f.length;d+=1)a.a.push(new G(e,f[d]))}};function Ea(a,b){this.c=a;this.a=b}var Fa={Arimo:!0,Cousine:!0,Tinos:!0};Ea.prototype.load=function(a){var b=new B,c=this.c,d=new ta(this.a.api,this.a.text),e=this.a.families;va(d,e);var f=new ya(e);Da(f);z(c,wa(d),C(b));E(b,function(){a(f.a,f.c,Fa)})};function Ga(a,b){this.c=a;this.a=b}Ga.prototype.load=function(a){var b=this.a.id,c=this.c.o;b?A(this.c,(this.a.api||"https://use.typekit.net")+"/"+b+".js",function(b){if(b)a([]);else if(c.Typekit&&c.Typekit.config&&c.Typekit.config.fn){b=c.Typekit.config.fn;for(var e=[],f=0;f<b.length;f+=2)for(var g=b[f],m=b[f+1],h=0;h<m.length;h++)e.push(new G(g,m[h]));try{c.Typekit.load({events:!1,classes:!1,async:!0})}catch(l){}a(e)}},2E3):a([])};function Ha(a,b){this.c=a;this.f=b;this.a=[]}Ha.prototype.load=function(a){var b=this.f.id,c=this.c.o,d=this;b?(c.__webfontfontdeckmodule__||(c.__webfontfontdeckmodule__={}),c.__webfontfontdeckmodule__[b]=function(b,c){for(var g=0,m=c.fonts.length;g<m;++g){var h=c.fonts[g];d.a.push(new G(h.name,ga("font-weight:"+h.weight+";font-style:"+h.style)))}a(d.a)},A(this.c,(this.f.api||"https://f.fontdeck.com/s/css/js/")+ea(this.c)+"/"+b+".js",function(b){b&&a([])})):a([])};var Y=new oa(window);Y.a.c.custom=function(a,b){return new sa(b,a)};Y.a.c.fontdeck=function(a,b){return new Ha(b,a)};Y.a.c.monotype=function(a,b){return new ra(b,a)};Y.a.c.typekit=function(a,b){return new Ga(b,a)};Y.a.c.google=function(a,b){return new Ea(b,a)};var Z={load:p(Y.load,Y)};"function"===typeof define&&define.amd?define('webfont',[],function(){return Z}):"undefined"!==typeof module&&module.exports?module.exports=Z:(window.WebFont=Z,window.WebFontConfig&&Y.load(window.WebFontConfig));}());

define('tcg/ygo/Checkbox',["react", "react-class"], function(React, ReactClass){
	return function(props)
	{
		return React.createElement(
			"span",
			{
				className: "ipsCustomInput"
			},
			React.createElement("input", {
				id: props.id,
				onChange: props.onChange,
				type: "checkbox",
				checked: props.checked
			}),
			React.createElement("span", {})
		);
	}
});
define('tcg/ygo/CardMaker',["react", "react-class", "./Card", "webfont", "./Checkbox"], function App(React, ReactClass, Card, WebFont, Checkbox)
{
    var emptyCard = {
        version: "1.0.0",
        rarity: "Common",
        name: "",
        level: 0,
        type: "",
        effect: "",
        atk: "",
        def: "",
        serial: "0123456789",
        copyright: "© 2020 YGOPRO.ORG",
        id: "",
        attribute: "None",
        pendulum:
        {
            enabled: false,
            effect: "",
            blue: "5",
            red: "5",
            boxSize: "Normal",
            boxSizeEnabled: false,
        },
        variant: "Normal",
        link:
        {
            topLeft: false,
            topCenter: false,
            topRight: false,
            middleLeft: false,
            middleRight: false,
            bottomLeft: false,
            bottomCenter: false,
            bottomRight: false,
        },
        layout: "Normal"
    }

    const EL = (tag, data, ...children) => {
        let result = document.createElement(tag);
        if(data) {
            Object.assign(result, data);
        }
        for(let child of children.map(EL.forceElement)) {
            result.appendChild(child);
        }
        return result;
    };
    EL.text = document.createTextNode.bind(document);
    EL.forceElement = (el) =>
        typeof el === "string"
            ? EL.text(el)
            : el;
    EL.removeClasses = (el) => {
        let toRemove;
        let didRemove = false;
        while(toRemove = el.classList[0]) {
            el.classList.remove(toRemove);
            didRemove = true;
        }
        return didRemove;
    };

    const loadScript = function (url, cb) {
        let scriptElement = document.createElement("script");
        scriptElement.src = url;
        if(cb) {
            scriptElement.addEventListener("load", cb);
        }
        document.head.appendChild(scriptElement);
    };

    var CardMakerApp = ReactClass({

        getInitialState: function initialState() {
            // Initialize data.
            this.updateListeners = this.updateListeners || {};
            // Custom card maker state.
            var saveDataKey = "ccms";
            window.addEventListener("beforeunload", function(e){
                localStorage.setItem(saveDataKey, JSON.stringify(this.state));
            }.bind(this));

            var savedata = JSON.parse(localStorage.getItem(saveDataKey));
            // console.log(savedata);
            var defaultdata = {
                card:
                {
                    version: "1.0.0",
                    name: "Custom Card",
                    level: 4,
                    type: "Cyberse/Effect",
                    icon: "None",
                    effect: "A modern card designer.",
                    atk: "0",
                    def: "0",
                    serial: "0123456789",
                    copyright: "© 2020 YGOPRO.ORG",
                    attribute: "None",
                    id: "SCK-000",
                    pendulum:
                    {
                        enabled: false,
                        effect: "",
                        blue: "5",
                        red: "5",
                        boxSize: "Normal",
                        boxSizeEnabled: true,
                    },
                    variant: "Normal",
                    // anime: {
                    //     enabled: false,
                    // },
                    link:
                    {
                        topLeft: false,
                        topCenter: false,
                        topRight: false,
                        middleLeft: false,
                        middleRight: false,
                        bottomLeft: false,
                        bottomCenter: false,
                        bottomRight: false,
                    },
                    layout: "Normal"
                }
            };

            WebFont.load({
                google: {
                    families: [
                        "Buenard",
                        "Spectral SC:semi-bold,extra-bold",
                        "Spectral",
                        "Amiri:italic",
                        "Audiowide",
                        "Crimson Text:semi-bold,bold",
                        "Heebo:medium"
                    ]
                },
                fontactive: function(){this.forceUpdate();}.bind(this)
            });

            this.onFieldUpdate("card.layout", function (state, value) {
                this.updateLayoutInputs(value);
            });

            return Object.assign({}, defaultdata, savedata);
        },

        updateLayoutInputs: function updateLayoutInputs (value = null, search = document) {
            if(value === null) {
                value = this.state.card.layout;
            }
            let thisLayout = Card.Layout[value].fn;

            if(thisLayout.variants) {
                this.styleVariants = {};
                for(let key of thisLayout.variants) {
                    this.styleVariants[key] = key;
                }
            }
            else {
                this.styleVariants = this.defaultStyleVariants;
            }

            if(thisLayout.defaultProps.boxSizeEnabled) {
                this.boxSizes = null;
            }
            else {
                this.boxSizes = { "Normal": "Normal" };
            }

            let kinds = thisLayout.kind;
            if(!Array.isArray(kinds)) {
                kinds = [ kinds ];
            }
            if(this.state.card.variant === "Anime") {
                kinds.push(Card.Kind.Anime);
            }
            if(this.state.card.variant === "Rush") {
                kinds.push(Card.Kind.Rush);
            }
            // console.log(kinds);
            this.updateForKind(kinds, document);
        },

        updateForKind: function updateForKind (kinds, search = document) {
            let toFilter = search.getElementsByClassName("filter");
            let acceptClasses = kinds.map(kind => CardMakerApp.kindToClassMap[kind]);

            for(let card of toFilter) {
                let classList = card.classList;
                let classListArray = [...classList];
                let classRejects = classListArray
                    .filter(klass => klass.startsWith("not-"))
                    .map(klass => klass.replace("not-", ""));

                let accept = true;
                let hasAcceptClass = classListArray.some(klass => klass.startsWith("if-"));
                if(hasAcceptClass) {
                    accept = acceptClasses.some(acceptClass => classList.contains(acceptClass));
                }
                let passesReject = true;
                if(classRejects.length) {
                    passesReject = classRejects.every(toReject => acceptClasses.indexOf(toReject) === -1);
                }

                if(accept && passesReject) {
                    card.style.display = "";
                }
                else {
                    card.style.display = "none";
                }
            }
        },

        onFieldUpdate: function onFieldUpdate(field, fn) {
            this.updateListeners[field] = this.updateListeners[field] || [];
            this.updateListeners[field].push(fn);
        },

        render: function render() {
            function makeSelect(data)
            {
                var options = [];
                for (var key in data)
                {
                    if (data.hasOwnProperty(key))
                    {
                        element = data[key] || {};
                        options[options.length] = React.createElement(
                            "option",
                            {
                                key: key,
                                value: typeof element.value !== "undefined" ? element.value : key
                            },
                            element.name || key
                        );
                    }
                }
                return options;
            }

            if(!window.renderOnResize) {
                window.renderOnResize = true;
                window.addEventListener("resize", () => {
                    this.setState({ state: this.state });
                    this.updateLayoutInputs();
                });
            }

            let isMobile = screen.width <= 756;
            console.log("Rendering, isMobile:", isMobile);

            var templates = makeSelect(Card.Layout);
            var attributes = makeSelect(Card.Attributes);
            var icons = makeSelect(Card.Icons);
            var rarities = makeSelect(Card.Rarities);

            // styleVariants
            this.defaultStyleVariants = this.defaultStyleVariants || makeSelect(Card.StyleVariants);
            this.styleVariants = this.styleVariants || this.defaultStyleVariants;
            if(!Array.isArray(this.styleVariants)) {
                this.styleVariants = makeSelect(this.styleVariants);
            }

            if(!this.styleVariants.some(({ key }) => key === this.state.card.variant)) {
                this.state.card.variant = this.styleVariants[0].key;
            }

            // boxSizes
            this.defaultBoxSizes = this.defaultBoxSizes || makeSelect(Card.BoxSizes);
            this.boxSizes = this.boxSizes || this.defaultBoxSizes;
            if(!Array.isArray(this.boxSizes)) {
                this.boxSizes = makeSelect(this.boxSizes);
            }

            if(!this.boxSizes.some(({ key }) => key === this.state.card.boxSize)) {
                this.state.card.boxSize = this.boxSizes[0].key;
            }

            let thisLayout = Card.Layout[this.state.card.layout].fn;
            let levelName = thisLayout.levelName || "Level";
            let hasPendulum = thisLayout.hasPendulum;

            if(this.state.card.variant === "Anime") {
                hasPendulum = true;
            }

            if(!hasPendulum) {
                this.state.card.pendulum.enabled = false;
            }

            let e = (tag, obj = null, ...rest) => {
                if(tag === "input" || tag === "textarea") {
                    if(!obj) {
                        obj = {};
                    }
                    let old;
                    if(obj.onFocus) {
                        old = obj.onFocus;
                    }
                    obj.onFocus = function (ev) {
                        window.lastFocused = ev.target;
                        if(old) {
                            old();
                        }
                    };
                }
                return React.createElement(tag, obj, ...rest);
            };
            let labelText = (text) => e("span", { className: "label-text" }, text);

            // circumvent React's overwriting the value setter
            // https://stackoverflow.com/a/46012210/4119004
            let nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype, "value"
            ).set;
            let nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLTextAreaElement.prototype, "value"
            ).set;
            let makeTextAdder = (text) =>
                e("button", { onClick: function () {
                    let target = lastFocused;
                    if(target) {
                        let update = nativeInputValueSetter;
                        if(target.tagName === "TEXTAREA") {
                            update = nativeTextAreaValueSetter;
                        }
                        update.call(target, lastFocused.value + text);
                        target.dispatchEvent(new Event("input", { bubbles: true }));
                    }
                }}, text);
            let primaryButtons = [
                e("button", { onClick: this.create, className: "ipsButton ipsButton_primary"}, "New Card"),
                e("button", { onClick: this.save, className: "ipsButton ipsButton_primary" }, "Save Card"),
                e("button", { onClick: this.exportAsPrompt, className: "ipsButton ipsButton_primary" }, "Export As"),
                e("button", { onClick: this.open, className: "ipsButton ipsButton_primary" }, "Load Card"),
                e("button", { onClick: this.link1, className: "ipsButton ipsButton_primary gold", title: "YGOPRO is a free automatic Yu-Gi-Oh! online game. All cards are available and new cards are added as soon as they are announced. Click here to download YGOPRO." }, "YGOPRO"),
                e("button", { onClick: this.link2, className: "ipsButton ipsButton_primary gold" }, "Discord"),
            ];
            let ptag = isMobile ? "div" : "tr";
            let ctag = isMobile ? "div" : "td";
            let result = e(
                "div",
                {
                    className: "cardmaker ygo"
                },
                e(
                    "div",
                    { className: "live-preview" },
                    // reactCard,
                    e(Card, this.state.card),

                    isMobile
                        ? e("div", { className: "options" },
                            ...primaryButtons
                        )
                        : e("table", { className: "options" },
                            e("tr", null,
                                e("td", null, primaryButtons[0]),
                                e("td", null, primaryButtons[1]),
                            ),
                            e("tr", null,
                                e("td", null, primaryButtons[2]),
                                e("td", null, primaryButtons[3]),
                            ),
                            e("tr", null,
                                e("td", null, primaryButtons[4]),
                                e("td", null, primaryButtons[5]),
                            )
                        )
                ),
                e(
                    "div",
                    { className: "editor" },

                    e(isMobile ? "div" : "table", null, e(isMobile ? "div" : "table", null,
                        e(ptag, null,
                            e(ctag, null, e("label", null, labelText("Name"),  e("input", { onChange: this.updateField("card.name"), type: "text", value: this.state.card.name }))),
                            e(ctag, null, e("label", null, labelText("Template"), e("select",  { onChange: this.updateField("card.layout"), value: this.state.card.layout }, templates))),
                            e(ctag, null, e("label", null, labelText("Rarity"), e("select", { onChange: this.updateField("card.rarity"), value: this.state.card.rarity }, rarities)))
                        ),
                        e(ptag, null,
                            e(ctag, null, e("label", null, labelText("Symbol"), e("select", { onChange: this.updateField("card.attribute"), value: this.state.card.attribute }, attributes))),
                            e(ctag, { class: "filter not-if-anime" }, e("label", null, labelText("Type"),  e("input", { onChange: this.updateField("card.type"), type: "text", value: this.state.card.type }))),
                            e(ctag, { class: "filter if-monster not-if-link" }, e("label", null, labelText(levelName), e("input", { onChange: this.updateField("card.level"), type: "number", value: this.state.card.level }))),
                            e(ctag, { class: "filter if-backrow" }, e("label", null, labelText("Icon"), e("select", { onChange: this.updateField("card.icon"), value: this.state.card.icon }, icons)))
                        ),
                        e(ptag, null,
                            e(ctag, null, e("label", null, labelText("Style Variant"), e("select", { disabled: this.styleVariants.length <= 1, onChange: this.updateField("card.variant"), value: this.state.card.variant }, this.styleVariants))),
                            e(ctag, { class: "filter if-monster" }, e("label", null, labelText("Attack"), e("input", { onChange: this.updateField("card.atk"), type: "text", value: this.state.card.atk }))),
                            e(ctag, { class: "filter if-monster" }, e("div", null,
                                e("label", { class: "filter not-if-link" }, labelText("Defense"), e("input", { onChange: this.updateField("card.def"), type: "text", value: this.state.card.def })),
                                e("label", { class: "filter if-link" }, labelText("Link Rating"), e("input", { onChange: this.updateField("card.def"), type: "text", value: this.state.card.def }))
                            ))
                        ),
                        e(ptag, { class: "filter not-if-anime" },
                            e(ctag, null, e("label", null, labelText("Set id"), e("input", { onChange: this.updateField("card.id"), type: "text", value: this.state.card.id }))),
                            e(ctag, null, e("div", { id: "serial-container" },
                                e("label", { id: "serial-number" }, labelText("Serial number"), e("input", { onChange: this.updateField("card.serial"), type: "text", value: this.state.card.serial })),
                                e("button", { id: "serial-randomize", onClick: this.randomizeSerialNumber, className: "ipsButton ipsButton_primary" }, "Randomize"),
                            )),
                            e(ctag, { class: "filter not-if-rush" }, e("label", null, labelText("Copyright"), e("input", { onChange: this.updateField("card.copyright"), type: "text", value: this.state.card.copyright }))),
                        )
                    )),

                    e("table", null, e("tbody", null,
                        e("tr", null,
                            e("td", { colSpan: 2 }, e("label", null, labelText("Image"), e("input", { onChange: this.updateField("card.image"), type: "text" }), e("input", { onChange: this.updateCardImage("image"), type: "file" })))
                        ),
                        e("tr", null,
                            e("td", null, e("label", null, labelText("Effect"), e("textarea", { id: "effect-input", onChange: this.updateField("card.effect"), value: this.state.card.effect }))),
                        ),
                    )),

                    // link
                    e(
                        "fieldset",
                        { class: "filter if-link", id: "link-container" },
                        e("legend", null, e("label", {}, "Link")),
                        e("table", null, e("tbody",null,
                            e("tr", null,
                                e("td", null,
                                    e(Checkbox, { id: "ccm_ygo:link.topLeft", onChange: function(e){this.updateField("card.link.topLeft")({target: {value: e.target.checked}});}.bind(this), checked: this.state.card.link.topLeft }),
                                    e("label", { htmlFor: "ccm_ygo:link.topLeft"}, "")
                                ),
                                e("td", null,
                                    e(Checkbox, { id: "ccm_ygo:link.topCenter", onChange: function(e){this.updateField("card.link.topCenter")({target: {value: e.target.checked}});}.bind(this), checked: this.state.card.link.topCenter }),
                                    e("label", { htmlFor: "ccm_ygo:link.topCenter"}, "" )
                                ),
                                e("td", null,
                                    e(Checkbox, { id: "ccm_ygo:link.topRight", onChange: function(e){this.updateField("card.link.topRight")({target: {value: e.target.checked}});}.bind(this), checked: this.state.card.link.topRight }),
                                    e("label", { htmlFor: "ccm_ygo:link.topRight"}, "" )
                                )
                            ),
                            e("tr", null,
                                e("td", null,
                                    e(Checkbox, { id: "ccm_ygo:link.middleLeft", onChange: function(e){this.updateField("card.link.middleLeft")({target: {value: e.target.checked}});}.bind(this), checked: this.state.card.link.middleLeft }),
                                    e("label", { htmlFor: "ccm_ygo:link.middleLeft"}, "")
                                ),
                                e("td"),
                                e("td", null,
                                    e(Checkbox, { id: "ccm_ygo:link.middleRight", onChange: function(e){this.updateField("card.link.middleRight")({target: {value: e.target.checked}});}.bind(this), checked: this.state.card.link.middleRight }),
                                    e("label", { htmlFor: "ccm_ygo:link.middleRight"}, "" )
                                )
                            ),
                            e("tr", null,
                                e("td", null,
                                    e(Checkbox, { id: "ccm_ygo:link.bottomLeft", onChange: function(e){this.updateField("card.link.bottomLeft")({target: {value: e.target.checked}});}.bind(this), checked: this.state.card.link.bottomLeft }),
                                    e("label", { htmlFor: "ccm_ygo:link.bottomLeft"}, "")
                                ),
                                e("td", null,
                                    e(Checkbox, { id: "ccm_ygo:link.bottomCenter", onChange: function(e){this.updateField("card.link.bottomCenter")({target: {value: e.target.checked}});}.bind(this), checked: this.state.card.link.bottomCenter }),
                                    e("label", { htmlFor: "ccm_ygo:link.bottomCenter"}, "" )
                                ),
                                e("td", null,
                                    e(Checkbox, { id: "ccm_ygo:link.bottomRight", onChange: function(e){this.updateField("card.link.bottomRight")({target: {value: e.target.checked}});}.bind(this), checked: this.state.card.link.bottomRight }),
                                    e("label", { htmlFor: "ccm_ygo:link.bottomRight"}, "" )
                                )
                            )
                        ))
                    ),

                    // pendulum
                    e(
                        "fieldset",
                        { class: "filter not-if-rush" + (hasPendulum ? "" : " hidden") },
                        e(
                            "legend",
                            null,
                            e(Checkbox, { id: "ccm_ygo:pendulum.enabled", onChange: function(e){this.updateField("card.pendulum.enabled")({target: {value: e.target.checked}});}.bind(this), type: "checkbox", checked: this.state.card.pendulum.enabled }),
                            e("label", { htmlFor: "ccm_ygo:pendulum.enabled"}, labelText("Pendulum") )
                        ),

                        e("table", { class: "mintable" },
                            e("tr", null,
                                e("td", { class: "pendulum-scale-holder" }, e("label", { class: "blue-scale" }, labelText("Blue scale"), e("input", { onChange: this.updateField("card.pendulum.blue"), type: "text", value: this.state.card.pendulum.blue }))),
                                e("td", { class: "pendulum-scale-holder" }, e("label", { class: "red-scale" }, labelText("Red scale"), e("input", { onChange: this.updateField("card.pendulum.red"), type: "text", value: this.state.card.pendulum.red }))),
                                e("td", null, e("label", { class: "filter not-if-anime" }, labelText("Pendulum box size"), e("select",  { disabled: this.boxSizes.length <= 1, onChange: this.updateField("card.pendulum.boxSize"), value: this.state.card.pendulum.boxSize }, this.boxSizes)))
                            )
                        ),
                        e("label", { class: "filter not-if-anime" }, labelText("Effect"), e("textarea", { onChange: this.updateField("card.pendulum.effect"), type: "text", value: this.state.card.pendulum.effect })),
                    ),

                    e("div", { "className": "special" },
                        e("label", null, "Add Special Characters"),
                        makeTextAdder("∞"),
                        makeTextAdder("☆"),
                        makeTextAdder("●"),
                        makeTextAdder("©"),
                        makeTextAdder("™"),
                    ),

                    e("button", { onClick: this.credits }, "Credits"),

                    e("button", { onClick: this.developer }, "Developer Features"),
                ),
                // popup
                e("div", { id: "popup-area", class: "hidden", onClick: (e) => e.target === e.currentTarget && this.closePopup() },
                    e("div", { id: "popup-content" },
                        e("button", { id: "popup-close", onClick: (e) => this.closePopup() }, "X"),
                        e("h2", { id: "popup-header" }, "Test Message"),
                        e("p", { id: "popup-text" }, "This is a test"),
                    )
                )
            );

            this.updateLayoutInputs(null, result);

            return result;
        },
        link1: function link1() {
            // ygopro link
            window.open("https://ygopro.org/", "_blank");
        },
        link2: function link2() {
            // ygopro discord link
            window.open("https://ygopro.org/discord/", "_blank");
        },
        developer: function developer() {
            let options = [
                ["Process image database", "processDatabaseCreate"],
                ["Log image data", "logImageData"]
            ];
            let body = EL("div");
            for(let [tag, operation] of options) {
                let button = EL("button");
                button.appendChild(EL.text(tag));
                button.addEventListener("click", () => {
                    this[operation]();
                });
                body.appendChild(button);
            }
            this.popup("Developer Features", body);
        },
        logImageData: function logImageData() {
            console.log(this.state.card);
        },
        processDatabaseCreate: function processDatabaseCreate(loaded = false) {
            if(!loaded) {
                return loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.2.2/jszip.min.js",
                    () => this.processDatabaseCreate(true)
                );
            }
            let imageInput = EL("input", { type: "file", accept: ".zip" });
            let cardDatabaseInput = EL("input", { type: "file", accept: ".json" });
            let submit = EL("button", null, "Submit");
            let body = EL("div", null,
                "Image Repository (.zip):",
                imageInput,
                "Card Database (.json, Dueling Nexus format):",
                cardDatabaseInput,
                submit,
            );
            submit.addEventListener("click", () => {
                JSZip.loadAsync(imageInput.files[0])
                .then((zipFile) => {
                    let reader = new FileReader();
                    reader.readAsText(cardDatabaseInput.files[0], "UTF-8");
                    reader.onload = (evt) => {
                        let json = JSON.parse(evt.target.result);
                        this.processDatabase(json, zipFile);
                    };
                });
            });
            this.popup("Process Database", body, "wide");
        },
        convertEntry: function (entry) {
            // TODO: pendulums
            let getStat = (stat) =>
                stat === -2
                    ? "?"
                    : stat.toString();
            let CardBorders = {
                2: "Spell",
                4: "Trap",
                128: "Ritual",
                64: "Fusion",
                8192: "Synchro",
                16384: "Token",
                8388608: "Xyz",
                67108864: "Link",
                16: "Normal",
                32: "Effect",
            };
            let MonsterTypes = {
                1: "Warrior",
                2: "Spellcaster",
                4: "Fairy",
                8: "Fiend",
                16: "Zombie",
                32: "Machine",
                64: "Aqua",
                128: "Pyro",
                256: "Rock",
                512: "Winged Beast",
                1024: "Plant",
                2048: "Insect",
                4096: "Thunder",
                8192: "Dragon",
                16384: "Beast",
                32768: "Beast-Warrior",
                65536: "Dinosaur",
                131072: "Fish",
                262144: "Sea Serpent",
                524288: "Reptile",
                1048576: "Psychic",
                2097152: "Divine-Beast",
                4194304: "Creator God",
                8388608: "Wyrm",
                16777216: "Cyberse",
            };
            let MonsterAttributes = {
                0: "None",
                1: "Earth",
                2: "Water",
                4: "Fire",
                8: "Wind",
                16: "Light",
                32: "Dark",
                64: "Divine",
            };
            let SpellTrapIcons = {
                128: "Ritual",
                65536: "Quick-play",
                131072: "Continuous",
                262144: "Equip",
                524288: "Field",
                1048576: "Counter",
            };
            const LinkArrowMeanings = {
                [0b000000001]: "bottomLeft",
                [0b000000010]: "bottomCenter",
                [0b000000100]: "bottomRight",
                [0b000001000]: "middleLeft",
                [0b000100000]: "middleRight",
                [0b001000000]: "topLeft",
                [0b010000000]: "topCenter",
                [0b100000000]: "topRight",
            };
            const blankPendulum = {
                enabled: false,
                blue: "5",
                red: "5",
                effect: "",
                boxSize: "Normal",
            };

            let result = {};

            result.pendulum = blankPendulum;

            result.name = entry.name;
            result.effect = entry.description;
            result.atk = getStat(entry.attack);
            result.def = getStat(entry.defence);
            result.level = entry.level.toString();
            let border;
            for(let [mask, resBorder] of Object.entries(CardBorders)) {
                if(entry.type & mask) {
                    border = resBorder;
                    if(mask <= 4) {
                        break;
                    }
                }
            }
            result.layout = border || result.layout;
            result.serial = entry.id.toString();
            if(entry.type & 1 || entry.type & 16384) {
                // if it is a monster or token
                let typeNames = [];
                let monsterType = MonsterTypes[entry.race];
                if(monsterType) {
                    typeNames.push(monsterType);
                }
                if(entry.type & 2097152) {
                    typeNames.push("Flip");
                }
                typeNames.push(result.layout);

                if(entry.type & 16777216) {
                    let [ pend, regular ] = result.effect
                        .replace(/\[ \w+ Effect \]/g, "")
                        .split(/-{4,}/)
                        .map(e => e.trim());

                    // console.log(regular, pend, result.effect);

                    result.effect = regular;
                    result.pendulum = {
                        enabled: true,
                        blue: entry.lscale.toString(),
                        red: entry.rscale.toString(),
                        effect: pend,
                        boxSize: "Normal",
                    };
                    if(pend.length <= 150) {
                        result.pendulum.boxSize = "Small";
                    }
                    typeNames.push("Pendulum");
                }

                if(result.layout !== "Effect" && result.layout !== "Normal" && result.layout !== "Token") {
                    typeNames.push("Effect");
                }
                result.type = typeNames.join("/");
                result.attribute = MonsterAttributes[entry.attribute] || "None";

                if(result.layout === "Link") {
                    result.def = result.level;
                    result.link = {};
                    for(let i = 256; i >= 1; i >>= 1) {
                        result.link[LinkArrowMeanings[i]] = !!(entry.defence & i);
                    }
                }
            }
            else {
                result.attribute = result.layout;
                result.type = result.layout + " Card";
                result.icon = "None";
                for(let [mask, resIcon] of Object.entries(SpellTrapIcons)) {
                    if(entry.type & mask) {
                        result.icon = resIcon;
                        break;
                    }
                }
            }
            return result;
        },
        processDatabase: async function processDatabase(json, zipFile) {
            let outZip = new JSZip();
            let imageFiles = zipFile.file(/.*/);
            let count = 0;
            let total = imageFiles.length;
            let isZooming = false;
            for(let image of imageFiles) {
                let newState = {};
                // overhead parsing
                let base = image.name.split(/[\/\\]/).pop().split(".");
                let ext = base.pop();
                base = base.join(".");
                // get URL
                let arr = await image.async("base64");
                let type = "image/" + ext;
                let url = "data:" + type + ";base64," + arr;
                newState.image = url;
                // get data
                let entry = json[base];
                if(!entry) {
                    console.warn("No entry for " + base);
                    continue;
                }
                
                Object.assign(newState, this.convertEntry(entry));
                
                // update state
                this.setState({ card: Object.assign({}, this.state.card, newState)});
                let status = await new Promise((resolve, reject) => {
                    count++;
                    let next = EL("button", null, "Next");
                    let pause = EL("button", null, "Pause");
                    let finish = EL("button", null, "Finish Now");
                    let zoomToggle = EL("button", null, isZooming ? "Unzoom" : "Zoom");

                    let body = EL("div", null, next, pause, finish, zoomToggle, EL("div", null, count + "/" + total));

                    let popupBody = () => {
                        this.popup("Ready?", body);
                        if(isZooming) {
                            setTimeout(resolve, 400, true);
                        }
                    }

                    next.addEventListener("click", function () {
                        resolve(true);
                    });
                    finish.addEventListener("click", function () {
                        resolve(false);
                    });
                    zoomToggle.addEventListener("click", function () {
                        isZooming = !isZooming;
                        resolve(true);
                    });
                    pause.addEventListener("click", function () {
                        let resume = EL("button", null, "Resume Processing");
                        let parent = document.getElementsByClassName("editor")[0];
                        parent.appendChild(resume);
                        this.closePopup();
                        resume.addEventListener("click", function () {
                            parent.removeChild(resume);
                            popupBody();
                        });
                    });
                    popupBody();
                });
                let toExport = this.getDataURL("JPG");
                toExport = toExport.replace(/data:.*?;base64,/, "");

                outZip.file(base + ".jpg", toExport, { base64: true });
                this.closePopup();
                if(!status) {
                    break;
                }
            }
            this.popup("Zip File Generating", "Please wait, zip generating.");
            outZip.generateAsync({ type: "blob" }).then(blob => {
                let filename = "cardImages.zip";
                if (window.navigator.msSaveOrOpenBlob) // IE10+
                    window.navigator.msSaveOrOpenBlob(blob, filename);
                else { // Others
                    var a = document.createElement("a"),
                            url = URL.createObjectURL(blob);
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(() => {
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                        this.popup("Zip File Generated", "Please accept the file download");
                    }, 0);
                }
            });

        },
        credits: function credits() {
            let body = document.createElement("div");
            let toParse = [
                ["Commissioned by:", "Seto Kaiba", "https://github.com/realSetoKaiba"],
                ["Programmed by:", "Sock#3222", "https://github.com/LimitlessSocks"],
                ["Management lead:", "Soaring__Sky#1313", "https://github.com/SoaringSky"],
                ["Rush Duel Templates by:", "alixsep", "https://www.deviantart.com/alixsep"],
                ["Derived from:", "Yemachu Cardmaker", "https://github.com/Yemachu/cardmaker"],
            ];
            for(let [intro, name, href] of toParse) {
                let linkBody = EL("p", null,
                    intro,
                    " ",
                    EL("a", { href: href, target: "_blank" }, name)
                );
                body.appendChild(linkBody);
            }
            this.popup("Credits", body);
        },
        create: function create()
        {
            this.setState({ card: emptyCard });
        },

        save: function save()
        {
            var link = document.createElement("a");
            link.setAttribute("href", "data:/text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(this.state.card)));
            link.setAttribute("download", (this.state.card.name || "Card") + ".json");
            if (document.createEvent)
            {
                var evt = document.createEvent("MouseEvent");
                evt.initEvent("click", true, true);
                link.dispatchEvent(evt);
            }
            else
            {
                link.click();
            }
        },

        // available styles: "default", "wide"
        popup: function (title, body, style="default") {
            body = EL.forceElement(body);
            let clearChildren = function (...nodes) {
                for(let node of nodes) {
                    while(node.firstChild) {
                        node.removeChild(node.firstChild);
                    }
                }
            };
            let popup = document.getElementById("popup-content");
            EL.removeClasses(popup);
            popup.classList.add(style);

            let popupArea = document.getElementById("popup-area");
            let header = document.getElementById("popup-header");
            let text = document.getElementById("popup-text");
            clearChildren(header, text);
            header.appendChild(document.createTextNode(title));
            text.appendChild(body);
            popupArea.classList.remove("hidden");
        },

        closePopup: function () {
            let popupArea = document.getElementById("popup-area");
            popupArea.classList.add("hidden");
        },

        getDataURL: function getDataURL(ext = "PNG") {
            let canvas = document.getElementsByTagName("canvas")[0];
            let dataURL;
            switch(ext) {
                case "PNG":
                    dataURL = canvas.toDataURL();
                    break;
                case "JPGHIGH":
                    dataURL = canvas.toDataURL("image/jpeg", 1.0);
                    break;
                case "JPG":
                    dataURL = canvas.toDataURL("image/jpeg");
                    break;
                case "JPGLOW":
                    dataURL = canvas.toDataURL("image/jpeg", 0.5);
                    break;
            }
            return dataURL;
        },

        exportAs: function (ext) {
            return (ev) => {
                let dataURL = this.getDataURL(ext);
                if(!dataURL) {
                    return;
                }
                let img = document.createElement("img");
                img.className = "img-result";
                img.src = dataURL;
                img.width = "250";
                img.addEventListener("click", function () {
                    window.open(dataURL, "_blank");
                });
                let divHolder = document.createElement("div");
                divHolder.appendChild(img);
                let message2 = document.createElement("div");
                message2.appendChild(
                    document.createTextNode("Click or tap the picture to download!")
                );
                divHolder.appendChild(message2);
                this.popup("Result", divHolder);
            };
        },

        exportAsPrompt: function () {
            let body = document.createElement("div");
            let options = {
                "PNG": "PNG",
                "JPGHIGH": "JPG (Best Quality)",
                "JPG": "JPG (High Quality)",
                "JPGLOW": "JPG (Low Quality)",
            };
            for(let [option, desc] of Object.entries(options)) {
                let button = document.createElement("button");
                button.addEventListener("click", this.exportAs(option));
                button.appendChild(document.createTextNode(desc));
                body.appendChild(button);
            }
            this.popup("Export Options", body);
        },

        open: function()
        {
            var file = document.createElement("input");
            file.setAttribute("type", "file");
            file.setAttribute("accept", ".json");
            file.addEventListener("change", function(evt)
            {
                var files = evt.target.files;
                if (FileReader && files.length)
                {
                    var fr = new FileReader();
                    fr.onload = function()
                    {
                        try
                        {
                            var card = JSON.parse(fr.result);
                            this.setState({ card: card });
                        }
                        catch(e)
                        {
                            console.error(e);
                        }
                    }.bind(this);
                    fr.readAsText(files[0]);
                }
            }.bind(this));
            if (document.createEvent)
            {
                var evt = document.createEvent("MouseEvent");
                evt.initEvent("click", true, true);
                file.dispatchEvent(evt);
            }
            else
            {
                link.click();
            }
        },

        updateField: function updateField(fieldName)
        {
            var nesting = fieldName.split(".");
            return function(event)
            {
                var path = [];
                var current = this.state;
                for (var i=0; i<nesting.length; ++i)
                {
                    path[path.length] = { node: current, name: nesting[i] };
                    current = current[nesting[i]];
                }
                path.reverse();
                // console.log("UPDATE PATH:", path);
                var newState = path.reduce(function(accumulator, current)
                {
                    var nested = {};
                    nested[current.name] = accumulator;
                    return Object.assign({}, current.node, nested)
                }, event.target.value);
                this.setState(newState);

                if(this.updateListeners[fieldName]) {
                    for(let fn of this.updateListeners[fieldName]) {
                        fn.bind(this)(this.state, event.target.value);
                    }
                }
            }.bind(this);
        },

        updateTemplate: function(event)
        {
            this.setState({ card: Object.assign({}, this.state.card, { layout: Card.Layout[event.target.value]})});
        },

        updateCardImage: function(fieldName)
        {
            return function(event)
            {

                var files = event.target.files;
                if (FileReader && files && files.length)
                {
                    var fr = new FileReader();
                    fr.onload = function()
                    {
                        var newState = {};
                        newState[fieldName] = fr.result;
                        this.setState({ card: Object.assign({}, this.state.card, newState)});
                    }.bind(this);
                    fr.readAsDataURL(files[0]);
                }
            }.bind(this);
        },

        randomizeSerialNumber: function()
        {
            var value = "0000000000" + (Math.random() * 10000000000).toFixed(0);
            // console.log(typeof value);

            this.updateField("card.serial")({target:{value: value.substring(value.length-10)}});
        }
    });

    CardMakerApp.kindToClassMap = {
        [Card.Kind.Monster]: "if-monster",
        [Card.Kind.Link]:    "if-link",
        [Card.Kind.Backrow]: "if-backrow",
        [Card.Kind.Skill]:   "if-skill",
        [Card.Kind.Anime]:   "if-anime",
        [Card.Kind.Rush]:    "if-rush",
    }
    return CardMakerApp;
});

define('App',["react", "react-class", "tcg/ygo/CardMaker"], function App(React, ReactClass, YGOCardMaker)
{
	return ReactClass({
		render: function render()
		{
			return React.createElement(YGOCardMaker, null);
		}
	});
});

(function ()
{
	// Let the user know the application functions, but is busy with loading.
	var root = document.getElementById("react-root");
	root.innerText = "Loading";
	
	// Let the user know the application didn't load.
	requirejs.onError = function(error)
	{
		root.innerText = "Loading failed";
	};
	
	require(["react", "react-dom", "App"],function main(React, ReactDOM, App)
	{
		// Start the application.
		ReactDOM.render(React.createElement(App), root);
	});
})();

define("main", function(){});

	define("react", [], function(){return React;});
	define("react-dom", [], function(){return ReactDOM;});
	define("react-class", [], function(){return ReactClass;});
    return require('main');
}));
