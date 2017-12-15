"use strict";
let storyScript;
/**
 * Metadata about engine version
 */
const KawaiiTypes = {
  ActArray: 0, //a.k.a. Script
  Act: 1,
  Function: 2, //@Function()
  Keyword: 3, //keyword
  VariableDefenition: 4, //$a=Character();
  Speech: 6, //a: "b"
  Comment: 8 //?comment
}
var KawaiiFunctions = {
  appear: function(parameters) {
    document.querySelector(".kawaii_front").innerHTML += "<img id='kawaii_CHARACTERSPRITE___" + parameters[0] + "' src='" + storyScript["variables"][parameters[0]]["folder"] + "/index." + storyScript["variables"][parameters[0]]["extension"] + "' />";
    window.Kawaii.current.Next = !window.Kawaii.current.Next;
  },
  dispose: function(parameters) {
    document.querySelector("#kawaii_CHARACTERSPRITE___" + parameters[0]).outerHTML = "";
    window.Kawaii.current.Next = !window.Kawaii.current.Next;
  },
  hide: function(parameters) {
    document.querySelector("#kawaii_CHARACTERSPRITE___" + parameters[0]).style.opacity = "0.000";
    window.Kawaii.current.Next = !window.Kawaii.current.Next;
  },
  show: function(parameters) {
    document.querySelector("#kawaii_CHARACTERSPRITE___" + parameters[0]).style.opacity = "1.000";
    window.Kawaii.current.Next = !window.Kawaii.current.Next;
  },
  mov: function(parameters) {
    document.querySelector("#kawaii_CHARACTERSPRITE___" + parameters[0]).style.right = document.querySelector("#kawaii_CHARACTERSPRITE___" + parameters[0]).style.right + parameters[1] + "pt";
    window.Kawaii.current.Next = !window.Kawaii.current.Next;
  },
  background: function(parameters) {
    document.querySelector(".kawaii_background").innerHTML = "<img src='" + kawaiiClarifyValue(parameters[0]) + "' alt='" + kawaiiClarifyValue(parameters[0]) + "' />";
    window.Kawaii.current.Next = !window.Kawaii.current.Next;
  },
  sprite: function(parameters) {
    document.querySelector("#kawaii_CHARACTERSPRITE___" + parameters[0]).src = storyScript["variables"][parameters[0]].folder + "/" + kawaiiClarifyValue(parameters[1]) + "." + storyScript["variables"][parameters[0]].extension;
    window.Kawaii.current.Next = !window.Kawaii.current.Next;
  },
  goto: function(parameters) {
    window.Kawaii.current.Act = kawaiiClarifyValue(parameters[0]);
    window.Kawaii.current.Position = 0;
    window.Kawaii.current.Next = !window.Kawaii.current.Next;;
  },
  halt: function(parameters) {
    window.Kawaii.current.Next = window.Kawaii.current.Next;
  },
  pause: function(parameters) {
    window.setTimeout(function() {
      window.Kawaii.current.Next != window.Kawaii.current.Next;
    }, parameters[0]);
  },
  noop: function(parameters) {
    while (true) {
      break;
    }
  },
  video: function(parameters) {
    document.querySelector(".kawaii_background").innerHTML = "<video autoplay nodownload><source src='" + parameters[0].match(/(?<=")(.*)(?=")/gmiu)[0] + "'></source></video>";
    window.Kawaii.current.Next = !window.Kawaii.current.Next;
    window.Kawaii.current.Position++;
    readNext();
  },
  lock: function(parameters) {
    window.setTimeout(function() {
      window.Kawaii.current.Next = !window.Kawaii.current.Next;
    }, parameters[0]);
    document.querySelector(".kawaii_lock").style.display = "inline-block";
    window.setTimeout(function() {
      document.querySelector(".kawaii_lock").style.display = "none";
    }, parameters[0]);;
  },
  choice: function(parameters) {
    let options = [];
    let htmlOptions = "";
    parameters.forEach(function(choice) {
      let opt = [choice.split('=>')[0].match(/(?<=")(.*)(?=")/gmiu)[0].replace(/\\"/gmiu, '"'), choice.split('=>')[1].match(/(?<=")(.*)(?=")/gmiu)[0].replace(/\\"/gmiu, '"')];
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
  die: function() {
    document.querySelector(".kawaii_container").outerHTML="";
  },
  save: function(save) {
    //TODO save
  }
}
const kawaiiMeta = {
  'version': '0.0.1alpha',
  'parserVersion': 'same',
  'release': false
};

function ParseException(message) {
  this.message = message;
  this.name = "Fatal parser exception";
}

function InterpretException(message) {
  this.message = message;
  this.name = "Interpreter exited with error";
}

function kawaiiClarifyValue(value) {
  if (value.match(/(?<=")(.*)(?=")/gmiu) !== null) {
    return value.match(/(?<=")(.*)(?=")/gmiu)[0];
  } else if (value.match(/(?<=')(.*)(?=')/gmiu) !== null) {
    return value.match(/(?<=')(.*)(?=')/gmiu)[0];
  } else {
    if (storyScript["variables"][value.replace(/ /gmiu, "")]["type"] == "variable") {
      return storyScript["variables"][value.replace(/ /gmiu, "")]["value"];
    } else {
      throw new ParseException("Error parsing input! Expected variable of type Variable, but variable of type " + storyScript["variables"][value.replace(' ', '')]["type"] + " given!");
    }
  }
}
/**
 * Function that does typewriter effect on the target element.
 */
function kawaiiTypewriter(txt, target, delay = 55) {
  var i = 0;

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
  } else if (/^\$/gmiu.test(line)) {
    return {
      type: KawaiiTypes.VariableDefenition,
      name: line.split("=")[0].replace(/\$/gmiu, ""),
      definition: line.split("=")[1]
    };
  } else if (/^@/gmiu.test(line)) {
    return {
      type: KawaiiTypes.Function,
      name: line.replace("@", "").match(/.+?(?=\()/gmiu)[0],
      parameters: line.replace("@", "").match(/(?<=\()(.*)(?=\))/gmiu)[0].split(",")
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
  string = string.replace(/^([\n])$/gmiu, '').replace(/^([ ]*)$/gmiu, '').replace(/\nACT/gmiu, 'ACT');
  var data = string.split('/ACT'); //get acts from string as an array
  data.forEach(function(act) {
    act = act.split("\n"); //get lines from act as an array
    var actName = act[0].replace(/ACT /gmui, "");
    act.splice(0, 1);
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

function kawaiiReadVariableFromString(variable, definition, script) {
  variable = variable.replace(/\$/gmiu, '');
  if (typeof definition == "undefined") {
    throw new ParseException("Invalid variable defenition!");
  }
  var variableType = definition.match(/.+?(?=\()/gmiu)[0];
  var variableParameters = definition.match(/(?<=\()(.*)(?=\))/gmiu)[0].split(",");
  switch (variableType) {
    case 'Character':
    if (variableParameters.length == 4) {
      script["variables"][variable] = {
        'type': 'character',
        'name': kawaiiClarifyValue(variableParameters[0]),
        'color': kawaiiClarifyValue(variableParameters[1]),
        'folder': kawaiiClarifyValue(variableParameters[2]),
        'extension': kawaiiClarifyValue(variableParameters[3])
      };
    } else {
      throw new ParseException("Character constructor expects 4 parameters, but " + variableParameters.length + " given!");
    }
    break;
    case 'Alias':
    script["variables"][variable] = {
      'type': 'alias',
      'value': variableParameters[0].replace(/"/gmiu, "")
    };
    break;
    case 'Variable':
    script["variables"][variable] = {
      'type': 'variable',
      'value': variableParameters[0].replace(/"/gmiu, "")
    };
    break;
    default:
    throw new ParseException("Could not parse script! Undefined data type: " + variableType + "!");
    return false;
    break;
  }
  return true;
}

function kawaiiReadScriptFromString(script) {
  return {
    'variables': {},
    'script': kawaiiReadActsFromString(script)
  };
}

function Kawaii(config = {}, target = "#kawaii_default", script = "", scriptPath) {
  if ("undefined" !== typeof scriptPath) {
    this.story = kawaiiReadScriptFromFile(scriptPath);
  } else {
    this.story = kawaiiReadScriptFromString(script);
  }
  this.config = config;
  this.target = target;
  this.setConfig = function(configurationPath) {
    this.config = configurationPath;
  };
  this.setTargetElement = function(targetElement) {
    this.target = document.querySelector(targetElement);
  };
  this.start = function() {
    /**
     * Line interpreter
     */
    function evaluate(statement) {
      console.log(statement);
      switch(statement["type"]) {
        case 2: //@Function()
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
        window.Kawaii.current.Next = !window.Kawaii.current.Next;
        break;
        case 6:
        if(storyScript["variables"][statement["character"]]["type"]=="character") {
          document.querySelector(".kawaii_name").style.color=storyScript["variables"][statement["character"]]["color"];
          document.querySelector(".kawaii_name").innerHTML=storyScript["variables"][statement["character"]]["name"];
          kawaiiTypewriter(kawaiiClarifyValue(statement["text"]), ".kawaii_line");
          setTimeout(function(){window.Kawaii.current.Next=!window.Kawaii.current.Next;}, kawaiiClarifyValue(statement["text"]).length*65);
        } else {
           throw ParseException("Error parsing input! Expected variable of type Character, but variable of type "+storyScript["variables"][statement[0].replace(' ','')]["type"]+" given!");
        }
        break;
        default:
        throw new InterpretException("Invalid statement occured!");
        break;
      }
    }
    let context = new AudioContext();
    let uid = btoa(config.UID);
    storyScript = this.story;
    window.Kawaii.current={};
    window.Kawaii.current.Next = true;
    window.Kawaii.current.Act = "INIT";
    window.Kawaii.current.Position = 0;
    window.Kawaii.current.Save = "";
    var DEFAULT_KEY = {
      alg: "A256CTR",
      ext: true,
      k: "b5kAYh5q8C7Se2JnaCxRj_gaFHF7n80QY7Jdue0s5uI",
      key_ops: ["encrypt", "decrypt", "wrapKey", "unwrapKey"],
      kty: "oct"
    };
    if (window.isSecureContext) {
      window.crypto.subtle.importKey("jwk", {
        kty: "oct",
        k: "b5kAYh5q8C7Se2JnaCxRj_gaFHF7n80QY7Jdue0s5uI",
        alg: "A256CTR",
        ext: true
      }, {
        name: "AES-CTR"
      }, true, ["encrypt", "decrypt", "wrapKey", "unwrapKey"]).then(function(key) {
        DEFAULT_KEY = key;
      });
    } else {
      console.warn("Warning! Context is not secure, so encrypted saves is disabled!");
    }
    const SAVE_STORAGE = openDatabase("kawaiiStorage__" + uid, "1.0.0.0.0.00", "kawaii Saves Storage Database (Application ID: " + uid + ")", 9007199254740991);
    if (storyScript["script"]["type"]!==0) {
      console.error("Script does not appears to be of type ActArray! Type 0 (ActArray) expected, but "+storyScript["type"]+" given!");
      return false;
    }
    function readNext() {
      if (window.Kawaii.current.Next) {
        window.Kawaii.current.Next = !window.Kawaii.current.Next;
        evaluate(storyScript["script"]["contents"][window.Kawaii.current.Act]["contents"][window.Kawaii.current.Position]);
        window.Kawaii.current.Position++;
      }
    }
    document.querySelector(target).outerHTML = '<div class="kawaii_container" id="kawaii__' + uid.replace(".", "_") + '" align="left" ><div class="kawaii_viewport"><div class="kawaii_menu" style="display: none;"></div><div class="kawaii_background"></div><div class="kawaii_front" align="center"></div><div class="kawaii_text"><h4 class="kawaii_name"></h4><p class="kawaii_line"></p></div><div class="kawaii_toolbar">&nbsp;&nbsp;<strong class="kawaii_lock"><em>LOCK</em></strong></div></div>';
    document.querySelector(".kawaii_front").addEventListener('click', function() {
      readNext();
    }, {
      'capture': true,
      'once': false,
      'passive': false,
      'mozSystemGroup': true
    }, true, true);
    document.querySelector(".kawaii_menu").addEventListener('click', function(event) {
      document.querySelector(".kawaii_menu").style.display = "none";
      evaluate(kawaiiReadStatement(atob(event.target.dataset.code)));
      readNext();
    }, {
      'capture': true,
      'once': false,
      'passive': false,
      'mozSystemGroup': true
    }, true, true);
  }
}