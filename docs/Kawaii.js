"use strict";
let storyScript;
/**
* Metadata about engine version
*/
var kawaiiMeta={
   'version':'0.0.1alpha',
   'parserVersion':'same',
   'release':false
};
function ParseException(message) {
   this.message=message;
   this.name="Fatal parser exception";
}
function kawaiiSave(act, position) {
    
}
function kawaiiClarifyValue(value) {
   if(value.match(/(?<=")(.*)(?=")/gmiu)!==null) {
      return value.match(/(?<=")(.*)(?=")/gmiu)[0];
   } else if(value.match(/(?<=')(.*)(?=')/gmiu)!==null) {
      return value.match(/(?<=')(.*)(?=')/gmiu)[0];
   } else {
      if(storyScript["variables"][value.replace(/ /gmiu, "")]["type"]=="variable") {
         return storyScript["variables"][value.replace(/ /gmiu, "")]["value"];
      } else {
         throw new ParseException("Error parsing input! Expected variable of type Variable, but variable of type "+storyScript["variables"][value.replace(' ','')]["type"]+" given!");
      }
   }
}
/**
* Function that does typewriter effect on the target element.
*/
function kawaiiTypewriter(txt, target, delay=55) {
   var i=0;
   function write() { document.querySelector(target).innerHTML=txt.substring(0, i);i++;if(!(i>txt.length)) {setTimeout(function(){write();}, delay);}}
   setTimeout(function(){write();}, delay);
}
function kawaiiReadStatement(line) {
   if(/:/gmiu.test(line)) { //split line if it is speech expression
      return line.split(':');
   } else {
      return [line];
   }
}
function kawaiiReadActsFromString(string) {
   var acts={};
   string=string.replace(/\$(.)*/gmiu, '').replace(/^([\n])$/gmiu, '').replace(/^([ ]*)$/gmiu, '').replace(/\nACT/gmiu, 'ACT');
   var data=string.split('/ACT'); //get acts from string as an array
   data.forEach( function( act ){
      act=act.split("\n"); //get lines from act as an array
      var actName=act[0].replace(/ACT /gmui, "");
      act.splice(0, 1);
      acts[actName]=[];
      act.forEach(function(line){
         acts[actName].push(kawaiiReadStatement(line));
      });
   } );
   if(typeof acts["INIT"]=="undefined") {
      throw new ParseException("Could not parse script! Script must contain INIT act!");
   }
   return acts;
}
function kawaiiReadVariablesFromString(variables) {
   var vars={};
   variables.forEach( function( string, position ){
      string=string.replace(/\$/gmiu, '');
      variables[position]=string;
   } );
   variables.forEach( function( variable ){
      variable=variable.split('=');
      if(variable.length!==2) {
         throw new ParseException("Invalid variable defenition!");
      }
      var variableType=variable[1].match(/.+?(?=\()/gmiu)[0];
      var variableParameters=variable[1].match(/(?<=\()(.*)(?=\))/gmiu)[0].split(",");
      switch(variableType) {
         case 'Character':
         if(variableParameters.length==4) {
            vars[variable[0]]={'type':'character', 'name':kawaiiClarifyValue(variableParameters[0]), 'color':kawaiiClarifyValue(variableParameters[1]), 'folder':kawaiiClarifyValue(variableParameters[2]), 'extension':kawaiiClarifyValue(variableParameters[3])};
         } else {
            throw new ParseException("Character constructor expects 4 parameters, but "+variableParameters.length+" given!");
         }
         break;
         case 'Alias':
         vars[variable[0]]={'type':'alias', 'value':variableParameters[0].replace(/"/gmiu, "")};
         break;
         case 'Variable':
         vars[variable[0]]={'type':'variable', 'value':variableParameters[0].replace(/"/gmiu, "")};
         break;
         default:
         console.error("Could not parse script! Undefined data type: "+variableType+"!");
         break;
      }
   } );
   return vars;
}
function kawaiiReadScriptFromString(script) {
   return {'variables':kawaiiReadVariablesFromString( script.match(/\$(.)*/gmiu) ), 'script':kawaiiReadActsFromString( script.replace(/\$(.)*/gmiu, '') )};
}
function Kawaii(config={}, target="#kawaii_default", script="", scriptPath) {
   if("undefined"!==typeof scriptPath) {
      this.story=kawaiiReadScriptFromFile(scriptPath);
   } else {
      this.story=kawaiiReadScriptFromString(script);
   }
   this.config=config;
   this.target=target;
   this.setConfig=function(configurationPath) { this.config=configurationPath; };
   this.setTargetElement=function(targetElement) { this.target=document.querySelector(targetElement); };
   this.start=function() {
      /**
      * Line interpreter
      */
      function evaluate(statement) {
         switch(statement.length) {
               case 1: //is instruction
               if(statement[0].match(/@/gmiu)==null) { //is not a function
                  switch(statement[0]) {
                     case 'die':
                     document.querySelector(".kawaii_container").outerHTML="";
                     break;
                     case '\n':
                     next=!next;
                     break;
                     default:
                     console.error("Undefined instruction occured: "+statement[0]+". Allowed instructions here: @goto, @noop, @choice, @imgchoice, @halt, @background, @pause, @prompt, @move, die, save, load, exec");
                     break;
                  }
               } else {
                  let instructionName=statement[0].replace("@", "").match(/.+?(?=\()/gmiu)[0];
                  let instructionParameters=statement[0].replace("@", "").match(/(?<=\()(.*)(?=\))/gmiu)[0].split(",");
                  switch(instructionName) {
                     case 'appear':
                     document.querySelector(".kawaii_front").innerHTML+="<img id='kawaii_CHARACTERSPRITE___"+instructionParameters[0]+"' src='"+storyScript["variables"][instructionParameters[0]]["folder"]+"/index."+storyScript["variables"][instructionParameters[0]]["extension"]+"' />";
                     next=!next;
                     break;
                     case 'dispose':
                     document.querySelector("#kawaii_CHARACTERSPRITE___"+instructionParameters[0]).outerHTML="";
                     next=!next;
                     break;
                     case 'hide':
                     document.querySelector("#kawaii_CHARACTERSPRITE___"+instructionParameters[0]).style.opacity="0.000";
                     next=!next;
                     break;
                     case 'show':
                     document.querySelector("#kawaii_CHARACTERSPRITE___"+instructionParameters[0]).style.display="1.000";
                     next=!next;
                     break;
                     case 'mov':
                     document.querySelector("#kawaii_CHARACTERSPRITE___"+instructionParameters[0]).style.right=document.querySelector("#kawaii_CHARACTERSPRITE___"+instructionParameters[0]).style.right+instructionParameters[1]+"pt";
                     next=!next;
                     break;
                     case 'sprite':
                     document.querySelector("#kawaii_CHARACTERSPRITE___"+instructionParameters[0]).src=storyScript["variables"][instructionParameters[0]].folder+"/"+kawaiiClarifyValue(instructionParameters[1])+"."+storyScript["variables"][instructionParameters[0]].extension;
                     next=!next;
                     break;
                     case 'background':
                     document.querySelector(".kawaii_background").innerHTML="<img src='"+kawaiiClarifyValue(instructionParameters[0])+"' alt='"+kawaiiClarifyValue(instructionParameters[0])+"' />";
                     next=!next;
                     break;
                     case 'goto':
                     act=kawaiiClarifyValue(instructionParameters[0]);
                     pos=0;
                     next=!next;
                     break;
                     case 'halt':
                     next=next;
                     break;
                     case 'pause':
                     case 'noop':
                     while(true) {
                        break;
                     }
                     next=!next;
                     break;
                     case 'audio':
                     break;
                     case 'lock':
                     window.setTimeout(function(){next=!next;}, instructionParameters[0]);
                     document.querySelector(".kawaii_lock").style.display="inline-block";
                     window.setTimeout(function(){document.querySelector(".kawaii_lock").style.display="none";}, instructionParameters[0]);
                     break;
                     case 'video':
                     document.querySelector(".kawaii_background").innerHTML="<video autoplay nodownload><source src='"+instructionParameters[0].match(/(?<=")(.*)(?=")/gmiu)[0]+"'></source></video>";
                     next=!next;
                     pos++;
                     readNext();
                     break;
                     case 'choice':
                     let options=[];
                     let htmlOptions="";
                     instructionParameters.forEach(function(choice){
                        let opt=[choice.split('=>')[0].match(/(?<=")(.*)(?=")/gmiu)[0].replace(/\\"/gmiu, '"'), choice.split('=>')[1].match(/(?<=")(.*)(?=")/gmiu)[0].replace(/\\"/gmiu, '"')];
                        options.push(opt);
                     });
                     options.forEach(function(opt){
                        htmlOptions+='<li><em class="kawaii_select" data-code="'+btoa(opt[1])+'">'+opt[0]+'</em></li>';
                     });
                     document.querySelector(".kawaii_menu").innerHTML='<ul>'+htmlOptions+'</ul>';
                     document.querySelector(".kawaii_menu").style.display="initial";
                     break;
                     case 'imgchoice':
                     break;
                     default:
                     console.error("Undefined instruction occured: "+statement[0]+". Allowed instructions here: @goto, @halt, @load, @noop, @choice, @pause, @prompt, @mov, @appear, @audio, @video, @sprite, die, save, load, exec");
                     break;
                  }
               }
               break;
               case 2: //is speech
               switch(statement[0].replace(' ','')) {
                  case 'javascript':
                  document.querySelector(".kawaii_name").innerHTML="";
                  kawaiiTypewriter( eval(statement[1]), ".kawaii_line");
                  next=!next;
                  break;
                  default:
                  if(storyScript["variables"][statement[0].replace(' ','')]["type"]=="character") {
                    document.querySelector(".kawaii_name").style.color=storyScript["variables"][statement[0].replace(' ','')]["color"];
                    document.querySelector(".kawaii_name").innerHTML=storyScript["variables"][statement[0].replace(' ','')]["name"];
                    kawaiiTypewriter(kawaiiClarifyValue(statement[1]), ".kawaii_line");
                    setTimeout(function(){next=!next;}, kawaiiClarifyValue(statement[1]).length*65);
                  } else {
                     throw ParseException("Error parsing input! Expected variable of type Character, but variable of type "+storyScript["variables"][statement[0].replace(' ','')]["type"]+" given!");
                  }
                  break;
               }
               break;
            }
      }
      let context=new AudioContext();
      let uid=btoa(config.UID);
      storyScript=this.story;
      let next=true;
      let act="INIT";
      let pos=0;
      let save="";
      if(window.isSecureContext) {
        console.info("Context is secure, key is going to be defined.");
        window.crypto.subtle.importKey("jwk", {kty: "oct", k: "b5kAYh5q8C7Se2JnaCxRj_gaFHF7n80QY7Jdue0s5uI", alg: "A256CTR", ext: true}, {name: "AES-CTR"}, true, ["encrypt", "decrypt", "wrapKey", "unwrapKey"]).then(function(key){const DEFAULT_KEY=key;});
      } else {
        console.warning("Context is insecure, protected saves is not going to be used!");
      }
      const SAVE_STORAGE=openDatabase("kawaiiStorage__"+uid, "1.0.0.0.0.00", "kawaii Saves Storage Database (Application ID: "+uid+")", 9007199254740991);
      function readNext() {
         if(next) {
            next=!next;
            evaluate(storyScript.script[act][pos]);
            pos++;
         }
      }
      document.querySelector(target).outerHTML='<div class="kawaii_container" id="kawaii__'+uid.replace(".", "_")+'" align="left" ><div class="kawaii_viewport"><div class="kawaii_menu" style="display: none;"></div><div class="kawaii_background"></div><div class="kawaii_front" align="center"></div><div class="kawaii_text"><h4 class="kawaii_name"></h4><p class="kawaii_line"></p></div><div class="kawaii_toolbar">&nbsp;&nbsp;<strong class="kawaii_lock"><em>LOCK</em></strong></div></div>';
      document.querySelector(".kawaii_front").addEventListener('click', function(){readNext();}, {'capture':true, 'once':false, 'passive':false, 'mozSystemGroup':true}, true, true);
      document.querySelector(".kawaii_menu").addEventListener('click', function(event){document.querySelector(".kawaii_menu").style.display="none"; evaluate( kawaiiReadStatement( atob(event.target.dataset.code) ) ); readNext();}, {'capture':true, 'once':false, 'passive':false, 'mozSystemGroup':true}, true, true);
   }   
}