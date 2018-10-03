/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var express = require('express'); // app server
var bodyParser = require('body-parser'); // parser for post requests
var AssistantV1 = require('watson-developer-cloud/assistant/v1'); // watson sdk

var app = express();

// Bootstrap application settings

app.use(express.static('./public')); // load UI from public folder
app.use(bodyParser.json());

// Create the service wrapper

var assistant = new AssistantV1({
  version: '2018-07-10'
});

// Endpoint to be call from the client side
app.post('/api/message', function (req, res) {
  var workspace = process.env.WORKSPACE_ID || '<workspace-id>';
  if (!workspace || workspace === '<workspace-id>') {
    return res.json({
      'output': {
        'text': 'The app has not been configured with a <b>WORKSPACE_ID</b> environment variable. Please refer to the ' + '<a href="https://github.com/watson-developer-cloud/assistant-simple">README</a> documentation on how to set this variable. <br>'
      }
    });
  }
  var payload = {
    workspace_id: workspace,
    context: req.body.context || {},
    input: req.body.input || {}
  };

  // Send the input to the assistant service
  assistant.message(payload, function (err, data) {
    if (err) {
      return res.status(err.code || 500).json(err);
    }

    // This is a fix for now, as since Assistant version 2018-07-10,
    // output text can now be in output.generic.text
    if (data.output.text.length === 0) {
      if (data.output.generic !== undefined) {
        if (data.output.generic[0].text !== undefined) {
          data.output.text = data.output.generic[0].text;
        } else if (data.output.generic[0].title !== undefined) {
          data.output.text = data.output.generic[0].title;
        }
      }
    }
    var middle_man = res.json(updateMessage(payload, data));
    return middle_man;
  });
});

/**
 * Updates the response text using the intent confidence
 * @param  {Object} input The request to the Assistant service
 * @param  {Object} response The response from the Assistant service
 * @return {Object}          The response with the updated message
 */
function updateMessage(input, response) {
  var responseText = null;
  if (response.actions && response.actions[0].name === 'dogs') {
    responseText = `<img src=${response.actions[0].parameters.person_name}>`
    response.output.text = responseText;
    console.log(JSON.stringify(response, undefined, 2));
    return response;
  }
  else if (response.actions && response.actions[0].name === 'try_locate') {
    if(response.actions[0].parameters.person_name.substr(0,14) === 'ANGFORCEFIND: ') {
      var disability = "False";
      if(response.context.elevator === "True") {
        disability = "True"
      }
      var execText = 'python3 return_map.py ';
      const execSync = require('child_process').execSync;
      execText = execText + '\'' + response.context.USERLOCATION + '\' ' + '\'' + response.actions[0].parameters.person_name.substr(14) + '\' ' + disability;
      //console.log(execText);
      //console.log(JSON.stringify(response, undefined, 2));
      const code = execSync(execText);

      var code_string = code.toString().substr(1);
      var code_output_length = Number(code.toString()[0]);

      //console.log(code_output_length);
      if(code_output_length === 1) {
        responseText = code_string;
        response.output.text = responseText;
        return response;
      }
      else{
        responseText = "Could Not Be Found :(";
        response.output.text = responseText;
        return response;
      }
    }
  }
  else if (response.actions && response.actions[0].name === 'people_finder_elevator') {
    var execText = 'python3 people_finder.py ';
    const execSync = require('child_process').execSync;
    execText = execText + '\'' + response.actions[0].parameters.person_name + '\'';
    const code = execSync(execText);

    var code_string = code.toString().substr(1);
    var code_output_length = Number(code.toString()[0]);

    delete response.output.generic[0]["options"];
    response.output.generic[0].options = [];

    var current_index;
    var id = "";
    var name = "";
    var site = "";
    var building = "";
    var floor_level = "";
    var room = "";
    var option_text;

    if(code_output_length === 0) {
      //TURN OPTION INTO TEXT!!!!!!!
      delete response.output["generic"];
      responseText = "Elevator Enabled.<br>I found No Correct Matches for: " + response.actions[0].parameters.person_name
      response.output.text = responseText;
      return response;
    }
    else if(code_output_length === 1) {
      response.output.generic[0].options = [];

      var code_array = []
      code_array = code_string.split('|');
      id = code_array[0];
      name = code_array[1];
      site = code_array[2];
      building = code_array[3];
      floor_level = code_array[4];
      room = code_array[5];

      option_text = `${name} - ${site}`
      response.output.generic[0].options.push({"label":option_text, "value":{"input": {"text": `ANGFORCEFIND: ${id}`}} })
      responseText = "Elevator Enabled.<br>There is only one employee at Northrop Grumman that match " + response.actions[0].parameters.person_name + ":<br>";// + "HERE ARE THE NAMES"
      response.output.generic[0].title = responseText;
      response.output.text = responseText;
      response.output.generic[0].preference = "button";

      //console.log(JSON.stringify(response, undefined, 2));
      return response;
    }
    else {
      response.output.generic[0].options = [];
      var options_array = [];
      //HAVE MULTIPLE OPTIONS
      var big_code_array = [];
      big_code_array = code_string.split('?');
      for (var i = 0; i < code_output_length; i++) {
        big_code_array[i] = big_code_array[i].split('|');
        id = big_code_array[i][0];
        name = big_code_array[i][1];
        site = big_code_array[i][2];
        building = big_code_array[i][3];
        floor_level = big_code_array[i][4];
        room = big_code_array[i][5];

        option_text = `${name} - ${site}`

        response.output.generic[0].options.push({"label":option_text, "value":{"input": {"text": `ANGFORCEFIND: ${id}`}} })
      }

      responseText = "Elevator Enabled.<br>These are all the employees at Northrop Grumman that match " + response.actions[0].parameters.person_name + ":<br>";// + "HERE ARE THE NAMES" + "<br>Type in the number corresponding to the person you want to navigate to!";//response.actions[0].parameters.room_number; //code.toString();
      response.output.generic[0].title = responseText;
      response.output.text = responseText;
      response.output.generic[0].preference = "button";

      //console.log(JSON.stringify(response, undefined, 2));      
      return response;
    }
    response.output.text = responseText;
    return response;
  }
  else if (response.actions && response.actions[0].name === 'people_finder_stairs') {
    var execText = 'python3 people_finder.py ';
    const execSync = require('child_process').execSync;
    execText = execText + '\'' + response.actions[0].parameters.person_name + '\'';
    const code = execSync(execText);

    var code_string = code.toString().substr(1);
    var code_output_length = Number(code.toString()[0]);

    delete response.output.generic[0]["options"];
    response.output.generic[0].options = [];

    var current_index;
    var id = "";
    var name = "";
    var site = "";
    var building = "";
    var floor_level = "";
    var room = "";
    var option_text;

    if(code_output_length === 0) {
      //TURN OPTION INTO TEXT!!!!!!!
      delete response.output["generic"];
      responseText = "Stairs Enabled.<br>I found No Correct Matches for: " + response.actions[0].parameters.person_name
      response.output.text = responseText;
      return response;
    }
    else if(code_output_length === 1) {
      response.output.generic[0].options = [];

      var code_array = []
      code_array = code_string.split('|');
      id = code_array[0];
      name = code_array[1];
      site = code_array[2];
      building = code_array[3];
      floor_level = code_array[4];
      room = code_array[5];

      option_text = `${name} - ${site}`
      response.output.generic[0].options.push({"label":option_text, "value":{"input": {"text": `ANGFORCEFIND: ${id}`}} })
      responseText = "Stairs Enabled.<br>There is only one employee at Northrop Grumman that match " + response.actions[0].parameters.person_name + ":<br>";// + "HERE ARE THE NAMES"
      response.output.generic[0].title = responseText;
      response.output.text = responseText;
      response.output.generic[0].preference = "button";

      //console.log(JSON.stringify(response, undefined, 2));
      return response;
    }
    else {
      response.output.generic[0].options = [];
      var options_array = [];
      //HAVE MULTIPLE OPTIONS
      var big_code_array = [];
      big_code_array = code_string.split('?');
      for (var i = 0; i < code_output_length; i++) {
        big_code_array[i] = big_code_array[i].split('|');
        id = big_code_array[i][0];
        name = big_code_array[i][1];
        site = big_code_array[i][2];
        building = big_code_array[i][3];
        floor_level = big_code_array[i][4];
        room = big_code_array[i][5];

        option_text = `${name} - ${site}`

        response.output.generic[0].options.push({"label":option_text, "value":{"input": {"text": `ANGFORCEFIND: ${id}`}} })
      }

      responseText = "Stairs Enabled.<br>These are all the employees at Northrop Grumman that match " + response.actions[0].parameters.person_name + ":<br>";// + "HERE ARE THE NAMES" + "<br>Type in the number corresponding to the person you want to navigate to!";//response.actions[0].parameters.room_number; //code.toString();
      response.output.generic[0].title = responseText;
      response.output.text = responseText;
      response.output.generic[0].preference = "button";

      //console.log(JSON.stringify(response, undefined, 2));      
      return response;
    }
    response.output.text = responseText;
    return response;
  }
  else if (response.actions && response.actions[0].name === 'initialize_finder') {
    var execText = 'python3 people_finder.py ';
    const execSync = require('child_process').execSync;
    execText = execText + '\'' + response.actions[0].parameters.person_name + '\'';
    const code = execSync(execText);

    var code_string = code.toString().substr(1);
    var code_output_length = Number(code.toString()[0]);

    delete response.output.generic[0]["options"];
    response.output.generic[0].options = [];

    var current_index;
    var id = "";
    var name = "";
    var site = "";
    var building = "";
    var floor_level = "";
    var room = "";
    var option_text;

    if(code_output_length === 0) {
      //TURN OPTION INTO TEXT!!!!!!!
      delete response.output["generic"];
      responseText = "I found No Correct Matches for: " + response.actions[0].parameters.person_name
      response.output.text = responseText;
      return response;
    }
    else if(code_output_length === 1) {
      response.output.generic[0].options = [];

      var code_array = []
      code_array = code_string.split('|');
      id = code_array[0];
      name = code_array[1];
      site = code_array[2];
      building = code_array[3];
      floor_level = code_array[4];
      room = code_array[5];

      option_text = `${name} - ${site}`
      response.output.generic[0].options.push({"label":option_text, "value":{"input": {"text": `ANGFORCEINITIALIZE: ${id}`}} })
      responseText = "Thanks " + response.actions[0].parameters.person_name + "! Now, Which one are you?<br>";// + "HERE ARE THE NAMES"
      response.output.generic[0].title = responseText;
      response.output.text = responseText;
      response.output.generic[0].preference = "button";

      //console.log(JSON.stringify(response, undefined, 2));
      return response;
    }
    else {
      response.output.generic[0].options = [];
      var options_array = [];
      //HAVE MULTIPLE OPTIONS
      var big_code_array = [];
      big_code_array = code_string.split('?');
      for (var i = 0; i < code_output_length; i++) {
        big_code_array[i] = big_code_array[i].split('|');
        id = big_code_array[i][0];
        name = big_code_array[i][1];
        site = big_code_array[i][2];
        building = big_code_array[i][3];
        floor_level = big_code_array[i][4];
        room = big_code_array[i][5];

        option_text = `${name} - ${site}`

        response.output.generic[0].options.push({"label":option_text, "value":{"input": {"text": `ANGFORCEINITIALIZE: ${id}`}} })
      }

      responseText = "Thanks " + response.actions[0].parameters.person_name + "! Now, Which one are you?<br>";// + "HERE ARE THE NAMES"// + "HERE ARE THE NAMES" + "<br>Type in the number corresponding to the person you want to navigate to!";//response.actions[0].parameters.room_number; //code.toString();
      response.output.generic[0].title = responseText;
      response.output.text = responseText;
      response.output.generic[0].preference = "button";

      //console.log(JSON.stringify(response, undefined, 2));
      return response;
    }
    response.output.text = responseText;
    return response;

  }
  else if (!response.output) {
    response.output = {};
  } 
  else {
    //console.log(JSON.stringify(response, undefined, 2));
    return response;
  }
  if (response.intents && response.intents[0]) {
    var intent = response.intents[0];
    // Depending on the confidence of the response the app can return different messages.
    // The confidence will vary depending on how well the system is trained. The service will always try to assign
    // a class/intent to the input. If the confidence is low, then it suggests the service is unsure of the
    // user's intent . In these cases it is usually best to return a disambiguation message
    // ('I did not understand your intent, please rephrase your question', etc..)
    if (intent.confidence >= 0.75) {
      responseText = 'I understood your intent was ' + intent.intent;
    } else if (intent.confidence >= 0.5) {
      responseText = 'I think your intent was ' + intent.intent;
    } else {
      responseText = 'I did not understand your intent';
    }
  }
  response.output.text = responseText;
  return response;
}

module.exports = app;