"use strict";
window.Kawaii={};
let storyScript;
/**
 * Metadata about engine version
 */
 
 const kawaiiMeta = {
  version: "0.0.0.1alpha",
  versionCode: 1,
  parserVersion: "same",
  release: false
};

function i18n() {
  const langs={en:"US-eng.lang", ru:"RU-rus.lang", ua:"UA-ukr.lang"};
  let locale=navigator.language;
  if(typeof langs[locale]==="undefined") {
    locale="en";
  }
  let request = new XMLHttpRequest();
  request.open("GET", "lang/"+langs[locale], false);
  request.send(null);
  let L10n={};
  request.responseText.split(",").forEach(function getString(pair) {
    L10n[pair.split(":")[0]]=pair.split(":")[1];
  });
  document.querySelectorAll("[data-L10n]").forEach(function localize(element) {
    if(typeof L10n[element.dataset.l10n]==="undefined") {
      element.innerText="L10n fault";
    } else {
      element.innerText=L10n[element.dataset.l10n];
    }
  });
}

function kawaiiChangeLockState() {
  if(window.Kawaii.current.Next) {
    window.Kawaii.current.Next = !window.Kawaii.current.Next;
    document.querySelector(".kawaii_next").style.opacity="0.000";
  } else {
    window.Kawaii.current.Next = !window.Kawaii.current.Next;
    document.querySelector(".kawaii_next").style.opacity="1.000";
  }
}

function kawaiiClarifyValue(value) {
  if(typeof value == "string") {
    if(value.match(/new (.*)/gmiu) !== null) {
      let constructorName = value.match(/^new [\s\S]*/gmiu)[0].replace("new ", "").match(/.+?(?=\()/gmiu)[0];
      let constructorArgs = value.match(/(\((.*)\))/gmiu)[0].replace(/\(||\)/gmiu, "").split(",");
      if(typeof KawaiiClasses[constructorName] !== "undefined") {
        return KawaiiClasses[constructorName](constructorArgs);
      } else {
        throw new ParseException("Error parsing input! Undefined class "+constructorName);
      }        
    } else if(value.match(/[A-z_\$~]{1,}\([\s\S]*\)/gmiu) !== null&&!/^new/gmiu.test(value)&&!/^"(.*)"$/gmiu.test(value)&&!/^'(.*)'$/gmiu.test(value)) {
      let parameters=value.match(/[A-z_\$~]{1,}\([\s\S]*\)/gmiu)[0].match(/\(([\s\S]*)\)/giu)[0].replace(/\(|\)| /gmiu, "").split(",");
      let name=value.match(/[A-z_\$~]{1,}\([\s\S]*\)/gmiu)[0].replace(/\(([\s\S]*)\)/giu, "");
      return KawaiiFunctions[name](parameters); //return function value
    } else if (value.match(/"(.*)"/gmiu) !== null) {
      return value.match(/"(.*)"/gmiu)[0].replace(/"/gmiu, '');
    } else if (value.match(/'(.*)'/gmiu) !== null) {
      return value.match(/'(.*)'/gmiu)[0].replace(/'/gmiu, '');
    } else {
      return storyScript["variables"][value.replace(/ /gmiu, "")];
    }
  } else {
    return value;
  }
}

/**
 * Functions, types, statements...
 */
const KawaiiTypes = {
  ActArray: 0, //a.k.a. Script
  Act: 1,
  Function: 2, //@Function()
  Keyword: 3, //keyword
  VariableDefenition: 4, //$a=Character();
  Speech: 6, //a: "b"
}

var KawaiiClasses = {
  Character(args) {
    return {
      type: "character",
      name: kawaiiClarifyValue(args[0]),
      color: kawaiiClarifyValue(args[1]),
      folder: kawaiiClarifyValue(args[2]),
      extension: kawaiiClarifyValue(args[3])
    };
  }
}

var KawaiiFunctions = {
  appear(parameters) {
    if(!(parameters[1]||typeof parameters[1] == undefined)) window.Kawaii.current.Environment.characters[parameters[0]]={hidden: false, sprite: "index", pos: 0, filters: {}};
    document.querySelector(".kawaii_front").innerHTML += "<img id='kawaii_CHARACTERSPRITE___" + parameters[0] + "' src='" + storyScript["variables"][parameters[0]]["folder"] + "/index." + storyScript["variables"][parameters[0]]["extension"] + "' />";
    kawaiiChangeLockState();
  },
  audio(parameters) {
    window.Kawaii.current.Environment.audio=kawaiiClarifyValue(parameters[0]);
    if(window.Kawaii.current.Configuration.audio=="audiocontext") {
      let file = kawaiiClarifyValue(parameters[0]);
      let request = new XMLHttpRequest();
      request.open('GET', file, true);
      request.responseType = 'arraybuffer';
      request.onload = function(array) {
        window.Kawaii.current.AudioContext.decodeAudioData(this.response, function(buff) {
          let buffer = buff;
          let source = window.Kawaii.current.AudioContext.createBufferSource();
          source.buffer=buffer;
          let playback = window.Kawaii.current.AudioContext.destination;
          source.connect(playback);
          source.start(0);
          kawaiiChangeLockState();
        });
      };
      request.send();
    } else {
      document.querySelector("#kawaiiaout").pause();
      document.querySelector("#kawaiiaout").src=kawaiiClarifyValue(parameters[0]);
      document.querySelector("#kawaiiaout").play();
      kawaiiChangeLockState();
    }
  },
  dispose(parameters) {
    window.Kawaii.current.Environment.characters[parameters[0]]=undefined;
    document.querySelector("#kawaii_CHARACTERSPRITE___" + parameters[0]).outerHTML = "";
    kawaiiChangeLockState();
  },
  hide(parameters) {
    window.Kawaii.current.Environment.characters[parameters[0]].hidden=true;
    document.querySelector("#kawaii_CHARACTERSPRITE___" + parameters[0]).style.opacity = "0.000";
    kawaiiChangeLockState();
  },
  show(parameters) {
    window.Kawaii.current.Environment.characters[parameters[0]].hidden=false;
    document.querySelector("#kawaii_CHARACTERSPRITE___" + parameters[0]).style.opacity = "1.000";
    kawaiiChangeLockState();
  },
  stop(parameters) {
    parameters.forEach(function(arg) {
      switch(kawaiiClarifyValue(arg)) {
        case "audio":
        window.Kawaii.current.Environment.audio=undefined;
        switch(window.Kawaii.current.Configuration.audio) {
          case "audiocontext":
          window.Kawaii.current.AudioContext.close().then(function rmContext() {
            window.Kawaii.current.AudioContext=undefined;
            window.Kawaii.current.AudioContext=new AudioContext();
          });
          break;
          default:
          document.querySelector("#kawaiiaout").pause();
          document.querySelector("#kawaiiaout").src=undefined;
          break;
        }
        break;
        case "video":
        window.Kawaii.current.Environment.video=undefined;
        document.querySelector(".kawaii_background > video").remove();
        break;
        case "background":
        window.Kawaii.current.Environment.background=undefined;
        document.querySelector(".kawaii_background > img").remove();
        break;
      }
    });
    kawaiiChangeLockState();
  },
  mov(parameters) {
    window.Kawaii.current.Environment.characters[parameters[0]].pos=parameters[1];
    document.querySelector("#kawaii_CHARACTERSPRITE___" + parameters[0]).style.right = document.querySelector("#kawaii_CHARACTERSPRITE___" + parameters[0]).style.right + parameters[1] + "pt";
    kawaiiChangeLockState();
  },
  background(parameters) {
    window.Kawaii.current.Environment.background=kawaiiClarifyValue(parameters[0]);
    document.querySelector(".kawaii_background").innerHTML = "<img src='" + kawaiiClarifyValue(parameters[0]) + "' alt='" + kawaiiClarifyValue(parameters[0]) + "' />";
    kawaiiChangeLockState();
  },
  sprite(parameters) {
    window.Kawaii.current.Environment.characters[parameters[0]].sprite=kawaiiClarifyValue(parameters[1]);
    document.querySelector("#kawaii_CHARACTERSPRITE___" + parameters[0]).src = storyScript["variables"][parameters[0]].folder + "/" + kawaiiClarifyValue(parameters[1]) + "." + storyScript["variables"][parameters[0]].extension;
    kawaiiChangeLockState();
  },
  goto(parameters) {
    window.Kawaii.current.Act = kawaiiClarifyValue(parameters[0]);
    window.Kawaii.current.Position = 0;
    kawaiiChangeLockState();
  },
  halt(parameters) {
    window.Kawaii.current.Next = window.Kawaii.current.Next;
  },
  pause(parameters) {
    window.setTimeout(function() {
      window.Kawaii.current.Next =! window.Kawaii.current.Next;
    }, parameters[0]);
  },
  noop(parameters) {
    while (true) {
      break;
    }
    kawaiiChangeLockState();
  },
  video(parameters) {
    window.Kawaii.current.Environment.video=kawaiiClarifyValue(parameters[0]);
    document.querySelector(".kawaii_background").innerHTML = "<video autoplay nodownload><source src='" + kawaiiClarifyValue(parameters[0]) + "'></source></video>";
    kawaiiChangeLockState();
    window.Kawaii.current.Position++;
    readNext();
  },
  lock(parameters) {
    window.setTimeout(function() {
      kawaiiChangeLockState();
    }, parameters[0]);
    document.querySelector(".kawaii_lock").style.display = "inline-block";
    window.setTimeout(function() {
      document.querySelector(".kawaii_lock").style.display = "none";
    }, parameters[0]);
  },
  choice(parameters) {
    let options = [];
    let htmlOptions = "";
    parameters.forEach(function(choice) {
      let opt = [kawaiiClarifyValue(choice.split('->')[0]).replace(/\\"/gmiu, "\""), kawaiiClarifyValue(choice.split('->')[1]).replace(/\\"/gmiu, "\"")];
      options.push(opt);
    });
    options.forEach(function(opt) {
      htmlOptions += '<li><em class="kawaii_select" data-code="' + btoa(opt[1]) + '">' + opt[0] + '</em></li>';
    });
    document.querySelector(".kawaii_menu").innerHTML = '<ul>' + htmlOptions + '</ul>';
    document.querySelector(".kawaii_menu").style.display = "initial";
  }
}

var KawaiiKeywords = {
  /**
  * Removes novel
  */
  die() {
    document.querySelector(".kawaii_container").outerHTML="";
  },
  /** 
  * Loads save if exists
  */
  load() {
    if(typeof localStorage[window.Kawaii.UID+"$save"]=="undefined") {
      throw new LoadSaveException("Impossible to read save with no save present!");
    } else {
      let save=atob(localStorage[window.Kawaii.UID+"$save"]).replace(/|||$/gmiu, '').split("|||");
      if(save[0].split("~")[0]=="kwi"&&save[0].split("~")[1]=="CC8C48"&&save[0].split("~")[2]=="D87565"&&save[0].split("~")[3]=="1") {
        window.Kawaii.current.Act=save[1].split("$")[0];
        window.Kawaii.current.Position=save[1].split("$")[1];
        storyScript.variables=JSON.parse(save[2]);
        let env=JSON.parse(save[3]);
        if(typeof env.background !== "undefined") {
          KawaiiFunctions.background(['"'+env.background+'"']);
        }
        if(typeof env.audio !== "undefined") {
          KawaiiFunctions.audio(['"'+env.audio+'"']);
        }
        if(typeof env.video !== "undefined") {
          KawaiiFunctions.video(['"'+env.video+'"']);
        }
        if(env.characters !== {}) {
          window.Kawaii.current.Environment.characters=env.characters;
          for(var name in env.characters) {
            if(env.characters.hasOwnProperty(name)) {
              let character = env.characters[name];
              KawaiiFunctions.appear([name, true]);
              if(typeof env.characters[name].sprite !== "undefined") {
                let sprite = env.characters[name].sprite;
                KawaiiFunctions.sprite([name, "'"+sprite+"'"]);
              }
              if(env.characters[name].hidden) {
                KawaiiFunctions.hide([name]);
                kawaiiChangeLockState();
              }
              KawaiiFunctions.mov([name, env.characters[name].pos]);
              kawaiiChangeLockState();
            }
          }
        }
      } else {
        throw new LoadSaveException("Impossible to read save! Save is corrupted or is not compatible with this Kawaii version.");
      }
    }
    kawaiiChangeLockState();
  },
  /**
  * Saves
  */
  save() {
    let savefile=btoa("kwi~CC8C48~D87565~1|||"+window.Kawaii.current.Act+"$"+(window.Kawaii.current.Position-1.00)+"|||"+JSON.stringify(storyScript.variables)+"|||"+JSON.stringify(window.Kawaii.current.Environment)+"|||%|||"+new Date().getTime()+"?");
    localStorage[window.Kawaii.UID+"$save"]=savefile;
  }
}

var KawaiiEventListeners = {
  nextline: [],
  save: [],
  load: [],
  exit: []
}

function ParseException(message) {
  this.message = message;
  this.name = "Fatal parser exception";
}

function InterpretException(message) {
  this.message = message;
  this.name = "Interpreter exited with error";
}

function LoadSaveException(message) {
  this.message = message;
  this.name = "Fatal saving data exception";
}

/**
 * Function that does typewriter effect on the target element.
 * @param {String} txt the text
 * @param {Element} target target
 * @param {Number} delay delay between characters printing
 * @private
 */
function kawaiiTypewriter(txt, target, delay = 25) {
  let i = 0;
  if(typeof txt!=="string"&&txt!==undefined&&txt!==null) {
    txt=txt.toLocaleString();
  } else if(txt===undefined||txt===null) {
    txt="NULL";
  }
  function write() {
    document.querySelector(target).innerHTML = txt.substring(0, i);
    i++;
    if (!(i > txt.length)) {
      setTimeout(function() {
        write();
      }, delay);
    }
  }
  setTimeout(function() {
    write();
  }, delay);
}

function kawaiiReadStatement(line) {
  if (/:/gmiu.test(line)) {
    return {
      type: KawaiiTypes.Speech,
      character: line.split(":")[0],
      text: line.split(":")[1]
    };
  } else if (/^(.* .*=.*)/gmiu.test(line)) {
    return {
      type: KawaiiTypes.VariableDefenition,
      name: line.split("=")[0].replace(/\$/gmiu, ""),
      definition: line.split("=")[1]
    };
  } else if (/[A-z_\$~]{1,}\([\s\S]*\)/gmiu.test(line)) {
    return {
      type: KawaiiTypes.Function,
      name: line.replace("@", "").match(/.+?(?=\()/gmiu)[0],
      parameters: line.replace("@", "").match(/(\((.*)\))/gmiu)[0].replace(/^\(/gmiu, '').replace(/\)$/gmiu, '').split(",")
    };
  } else {
    return {
      type: KawaiiTypes.Keyword,
      name: line
    };
  }
}

function kawaiiReadActsFromString(string) {
  var acts = {
    type: KawaiiTypes.ActArray,
    contents: {}
  };
  string = string.replace(/^([\n])$/gmiu, "").replace(/^([ ]*)$/gmiu, "").replace(/\nACT/gmiu, "ACT");
  var data = string.split("/ACT"); //get acts from string as an array
  data.forEach(function(act) {
    act = act.split("\n"); //get lines from act as an array
    var actName = act[0].replace(/ACT /gmui, "");
    act.splice(0, 1); //remove ACT INIT
    act.splice(act.length-1, 1); //remove last newline artifact
    acts["contents"][actName] = {
      type: KawaiiTypes.Act,
      contents: []
    };
    act.forEach(function(line) {
      acts["contents"][actName]["contents"].push(kawaiiReadStatement(line));
    });
  });
  if (typeof acts["contents"]["INIT"] == "undefined") {
    throw new ParseException("Could not parse script! Script must contain INIT act!");
  }
  return acts;
}

function kawaiiReportError(name, message) {
  document.querySelector(".kawaii_background").style["background-color"]="darkgoldenrod";
  document.querySelector(".kawaii_background").style["color"]="red";
  document.querySelector(".kawaii_background").style["z-index"]="9007199254740991";
  document.querySelector(".kawaii_background").innerHTML="<h1 style='min-height: 28px; height: 28px;'>An error occured!</h1><hr style='min-height: 1px; height: 1px;'/><details style='min-height: 28px; height: 28px; color: black; font-family: monospace;'><summary style='min-height: 28px; height: 28px;'>Show details</summary><xhr style='margin: 10px; width: 80%; min-height: 28px; height: 28px;'>"+name+" (Details: "+message+").<br/>At Script."+window.Kawaii.current.Act+" at line "+window.Kawaii.current.Position+"</xhr></details>";
  return true;
}

function kawaiiReadVariableFromString(variable, definition, script) {
  if (typeof definition == "undefined") {
    throw new ParseException("Invalid variable defenition!");
  }
  let variableType = variable.split(" ")[0];
  let constructorType = definition.match(/.+?(?=\()/gmiu);
  if(constructorType !== null) constructorType=constructorType[0].replace("new ", "");
  let variableValue=definition;
  let variableInternalType = constructorType==null ? "variable" : constructorType.toLowerCase();
  if(variableType !== constructorType&&constructorType !== null&&variableType !== "var") return false;
  script["variables"][variable.split(" ")[1]] = kawaiiClarifyValue(variableValue);
  return true;
}

function kawaiiReadScriptFromString(script) {
  return {
    variables: {"true": true, "false": false, "null": undefined, "___ENGINE_VERSION___": kawaiiMeta.version},
    script: kawaiiReadActsFromString(script)
  };
}

/**
* Main Kawaii class
* @example
* const novel = new Kawaii({id: "sample", audio: "audiocontext"}, "#sample", sampleScript);
*/
class Kawaii {
  /**
  * Kawaii novel constructor
  * @param {Object} config Your configuration
  * @param {String} target element (CSS Selector syntax)
  * @param {String} script
  * @public
  */
  constructor(config, target, script) {
    script=script.replace(/(rem (.*))|(\(\*(.*)*\*\))|(\$!(.*))/gmiu, ""); //remove comments
    this.config = config;
    this.target = document.querySelector(target);
    this.story = kawaiiReadScriptFromString(script);
    /**
    * Used to add custom keyword to interpreter
    * @param {String} name keyword name
    * @param {function} handler
    * @example window.Kawaii.addKeyword("alert", function() {alert("Hello world!");});
    * @public
    */
    window.Kawaii.addKeyword = function(name, handler) {
      KawaiiKeywords[name]=handler;
    }
    /**
    * Used to add custom function to interpreter
    * @param {String} name keyword name
    * @param {function(args: String[])} handler
    * @example window.Kawaii.addFunction("logMyArgs", function(args) {console.log(args);});
    * @public
    */
    window.Kawaii.addFunction = function(name, handler) {
      KawaiiFunctions[name]=handler;
    }
    /**
    * Add event listener
    * @param {String} name event name
    * @param {function(event)} event handler
    * @example window.Kawaii.addEventListener("load", function(Event) {alert("Loaded save!");});
    * @public
    */
    window.Kawaii.addEventListener = function(name, handler) {
      KawaiiEventListeners[name].push(handler);
    }
    
    storyScript = this.story;
  }
  /**
  * Interpreter function
  * @protected
  */
  evaluate(statement) {
    console.log(statement);
    switch(statement["type"]) {
      case 2: //Function()
      if(typeof KawaiiFunctions[statement["name"]] == "undefined") {
        throw new InterpretException("Function "+statement["name"]+" is not defined!!");
      } else {
        KawaiiFunctions[statement["name"]](statement["parameters"]);
      }
      break;
      case 3: //Keywords
      if(typeof KawaiiKeywords[statement["name"]] == "undefined") {
        throw new InterpretException("Keyword "+statement["name"]+" is not defined!!");
      } else {
        KawaiiKeywords[statement["name"]]();
      }
      break;
      case 4: //variable defenition
      kawaiiReadVariableFromString(statement["name"], statement["definition"], storyScript);
      window.Kawaii.current.Position++;
      this.evaluate(storyScript["script"]["contents"][window.Kawaii.current.Act]["contents"][window.Kawaii.current.Position]);
      break;
      case 6:
      if(kawaiiClarifyValue(statement["character"]).type=="character") {
        document.querySelector(".kawaii_name").style.color=kawaiiClarifyValue(statement["character"]).color;
        document.querySelector(".kawaii_name").innerHTML=kawaiiClarifyValue(statement["character"]).name;
        kawaiiTypewriter(kawaiiClarifyValue(statement["text"]), ".kawaii_line");
        setTimeout(function(){kawaiiChangeLockState();}, kawaiiClarifyValue(statement["text"]).length*25);
      } else {
         throw ParseException("Error parsing input! Expected variable of type Character, but variable of type "+storyScript["variables"][statement[0].replace(' ','')]["type"]+" given!");
      }
      break;
      default:
      throw new InterpretException("Invalid statement occured!");
      break;
    }
  }
  /**
  * Interprets next line
  * @protected
  */
  readNext() {
    if (window.Kawaii.current.Next) {
      kawaiiChangeLockState();
      try {
        if(storyScript["script"]["contents"][window.Kawaii.current.Act]["contents"][window.Kawaii.current.Position]!==undefined) {
          this.evaluate(storyScript["script"]["contents"][window.Kawaii.current.Act]["contents"][window.Kawaii.current.Position]);
          KawaiiEventListeners.nextline.forEach(function(func) { func(window.Kawaii.current.Position, window.Kawaii.current.Act, storyScript["script"]["contents"][window.Kawaii.current.Act]["contents"][window.Kawaii.current.Position]); });
        } else {
          alert("End.");
        }
      } catch(Exception) {
        console.error("Error interpreting script! "+Exception.message+" at Act "+window.Kawaii.current.Act+" line "+window.Kawaii.current.Position+".");
        kawaiiReportError(Exception.name, Exception.message+"\nStack trace: \n"+Exception.stack);
      }
      window.Kawaii.current.Position++;
    }
  }
  /**
  * Starts the novel
  * @param {String} arguments
  * @experemental
  * @public
  */
  start(args) {
    let instance=this;
    window.Kawaii.current={};
    window.Kawaii.current.AudioContext = new AudioContext();
    window.Kawaii.current.Next = true;
    window.Kawaii.current.Act = "INIT";
    window.Kawaii.current.Position = 0;
    window.Kawaii.current.Save = "";
    window.Kawaii.current.Environment = {background: undefined, audio: undefined, video: undefined, characters: {undef: undefined}};
    
    Object.defineProperty(window.Kawaii.current, "Configuration", {
      value: this.config,
      writable: false,
      enumerable: true,
      configurable: false
    });
    
    Object.defineProperty(window.Kawaii, "UID", {
      value: btoa(this.config.UID),
      writable: false,
      enumerable: false,
      configurable: false
    });
    
    if (storyScript["script"]["type"]!==0) {
      console.error("Script does not appears to be of type ActArray! Type 0 (ActArray) expected, but "+storyScript["type"]+" given!");
      return false;
    }

    this.target.outerHTML = '<div class="kawaii_container" id="kawaii__' + window.Kawaii.UID.replace(".", "_") + '" align="left" ><audio id="kawaiiaout" src="" autoplay loop></audio><div class="kawaii_viewport"><div class="kawaii_menu" style="display: none;"></div><div class="kawaii_background"></div><div class="kawaii_front" align="center"></div><div class="kawaii_text"><h4 class="kawaii_name"></h4><p class="kawaii_line"></p><ins class="kawaii_next">&#x21db;</ins></div><div class="kawaii_toolbar">&nbsp;&nbsp;<a id="KawaiiSaveButton" data-L10n="save-button"></a>&nbsp;&nbsp;<a id="KawaiiLoadButton" data-L10n="load-button"></a><strong class="kawaii_lock"><em>LOCK</em></strong></div></div>';
    i18n(); //Internationalize
    
    document.querySelector(".kawaii_front").addEventListener('click', function() {
      instance.readNext();
    }, {
      'capture': true,
      'once': false,
      'passive': false,
      'mozSystemGroup': true
    }, true, true);
    
    document.querySelector("#KawaiiSaveButton").addEventListener('click', KawaiiKeywords.save);
    
    document.addEventListener('keydown', function(event) {
      if(event.keyCode===83) {
        KawaiiKeywords.save();
      } else if(event.keyCode===76) {
        KawaiiKeywords.load();
      }
    });
    
    document.querySelector("#KawaiiLoadButton").addEventListener('click', KawaiiKeywords.load);
    document.querySelector(".kawaii_menu").addEventListener('click', function(event) {
    document.querySelector(".kawaii_menu").style.display = "none";
    
    try {
      instance.evaluate(kawaiiReadStatement(atob(event.target.dataset.code)));
    } catch(Exception) {
      console.error("Error interpreting script! "+Exception.message+" at Act "+window.Kawaii.current.Act+" line "+window.Kawaii.current.Position+".");
      kawaiiReportError(Exception.name, Exception.message);
    }
    
    readNext();
    }, {
      'capture': true,
      'once': false,
      'passive': false,
      'mozSystemGroup': true
    }, true, true);
  }
}