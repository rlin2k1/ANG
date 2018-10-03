// The ConversationPanel module is designed to handle
// all display and behaviors of the conversation column of the app.
/* eslint no-unused-vars: "off" */
/* global Api: true, Common: true*/
//global var decision = true;

var ConversationPanel = (function () {
  var settings = {
    selectors: {
      chatBox: '#scrollingChat',
      fromUser: '.from-user',
      fromUserSmall: '.from-user-small',
      fromWatson: '.from-watson',
      fromWatsonSmall: '.from-watson',
      latest: '.latest'
    },
    authorTypes: {
      user: 'user',
      watson: 'watson'
    }
  };

  // Publicly accessible methods defined
  return {
    init: init,
    setMessage: setMessage,
    sendMessage: sendMessage,
    inputKeyDown: inputKeyDown
  };

  // Initialize the module
  function init() {
    chatUpdateSetup();
    initEnterSubmit();
    Api.sendRequest('', null);
    setupInputBox();
  }
  // Set up callbacks on payload setters in Api module
  // This causes the displayMessage function to be called when messages are sent / received
  function chatUpdateSetup() {
    var currentRequestPayloadSetter = Api.setRequestPayload;
    Api.setRequestPayload = function (newPayloadStr) {
      currentRequestPayloadSetter.call(Api, newPayloadStr);
      displayMessage(JSON.parse(newPayloadStr), settings.authorTypes.user);
    };

    var currentResponsePayloadSetter = Api.setResponsePayload;
    Api.setResponsePayload = function (newPayloadStr) {
      currentResponsePayloadSetter.call(Api, newPayloadStr);
      displayMessage(JSON.parse(newPayloadStr), settings.authorTypes.watson);
    };
  }

    // Set up the input box to submit a message when enter is pressed
  function initEnterSubmit() {
    document.getElementById('textInput')
      .addEventListener('keypress', function (event) {
        if (event.keyCode === 13) {
          sendMessage();
          event.preventDefault();
        }
      }, false);
  }

  // Set up the input box to underline text as it is typed
  // This is done by creating a hidden dummy version of the input box that
  // is used to determine what the width of the input text should be.
  // This value is then used to set the new width of the visible input box.
  function setupInputBox() {
    var input = document.getElementById('textInput');
    var dummy = document.getElementById('textInputDummy');
    var minFontSize = 14;
    var maxFontSize = 16;
    var minPadding = 4;
    var maxPadding = 6;

    // If no dummy input box exists, create one
    if (dummy === null) {
      var dummyJson = {
        'tagName': 'div',
        'attributes': [{
          'name': 'id',
          'value': 'textInputDummy'
        }]
      };

      dummy = Common.buildDomElement(dummyJson);
      document.body.appendChild(dummy);
    }

    function adjustInput() {
      if (input.value === '') {
        // If the input box is empty, remove the underline
        input.classList.remove('underline');
        input.setAttribute('style', 'width:' + '100%');
        input.style.width = '100%';
      } else {
        // otherwise, adjust the dummy text to match, and then set the width of
        // the visible input box to match it (thus extending the underline)
        input.classList.add('underline');
        var txtNode = document.createTextNode(input.value);
        ['font-size', 'font-style', 'font-weight', 'font-family', 'line-height',
          'text-transform', 'letter-spacing'
        ].forEach(function (index) {
          dummy.style[index] = window.getComputedStyle(input, null).getPropertyValue(index);
        });
        dummy.textContent = txtNode.textContent;

        var padding = 0;
        var htmlElem = document.getElementsByTagName('html')[0];
        var currentFontSize = parseInt(window.getComputedStyle(htmlElem, null).getPropertyValue('font-size'), 10);
        if (currentFontSize) {
          padding = Math.floor((currentFontSize - minFontSize) / (maxFontSize - minFontSize) *
            (maxPadding - minPadding) + minPadding);
        } else {
          padding = maxPadding;
        }

        var widthValue = (dummy.offsetWidth + padding) + 'px';
        input.setAttribute('style', 'width:' + widthValue);
        input.style.width = widthValue;
      }
    }

    // Any time the input changes, or the window resizes, adjust the size of the input box
    input.addEventListener('input', adjustInput);
    window.addEventListener('resize', adjustInput);

    // Trigger the input event once to set up the input box and dummy element
    Common.fireEvent(input, 'input');
  }

  function getMessage() {
    var userInput = document.getElementById('textInput');
    return userInput.value;
  }

  function setMessage(text) {
    var userInput = document.getElementById('textInput');
    userInput.value = text;
    userInput.focus();
    Common.fireEvent(userInput, 'input');
  }

  // Send the message from the input box
  function sendMessage(newText) {
    var text;
    if (newText) {
      text = newText;
    } else {
      text = getMessage();
    }
    if (!text) {
      return;
    }
    setMessage('');
    var latestResponse = Api.getResponsePayload();
      if (latestResponse) {
        context = latestResponse.context;
    }

    Api.sendRequest(text, context);
  }


  // Display a user or Watson message that has just been sent/received
  function displayMessage(newPayload, typeValue) {
    var decision = false;

    var isUser = isUserMessage(typeValue);
    var textExists = (newPayload.input && newPayload.input.text) ||
      (newPayload.output && newPayload.output.text);

    if ((newPayload.actions && newPayload.actions[0].name === 'large_text' ) || (newPayload.context.big_text) && newPayload.context.big_text === "true") {
      decision = true;
      console.log(decision);
    }

    if (isUser !== null && textExists) {
      // Create new message DOM element
      var messageDivs = buildMessageDomElements(newPayload, isUser);
      var chatBoxElement = document.querySelector(settings.selectors.chatBox);
      var previousLatest = chatBoxElement.querySelectorAll((isUser ? (decision ? '.from-user' : '.from-user-small') : (decision ? 'from-watson' : 'from-watson-small')) +
        settings.selectors.latest);
      // Previous "latest" message is no longer the most recent
      if (previousLatest) {
        Common.listForEach(previousLatest, function (element) {
          element.classList.remove('latest');
        });
      }

      messageDivs.forEach(function (currentDiv) {
        chatBoxElement.appendChild(currentDiv);
        // Class to start fade in animation
        currentDiv.classList.add('load');
      });
      // Move chat to the most recent messages when new messages are added
      scrollToChatBottom(decision);
    }
  }

  // Checks if the given typeValue matches with the user "name", the Watson "name", or neither
  // Returns true if user, false if Watson, and null if neither
  // Used to keep track of whether a message was from the user or Watson
  function isUserMessage(typeValue) {
    if (typeValue === settings.authorTypes.user) {
      return true;
    } else if (typeValue === settings.authorTypes.watson) {
      return false;
    }
    return null;
  }

  // Constructs new DOM element from a message payload
  function buildMessageDomElements(newPayload, isUser) {
    var decision = false;
    var textArray = isUser ? newPayload.input.text : newPayload.output.text;
    if (Object.prototype.toString.call(textArray) !== '[object Array]') {
      textArray = [textArray];
    }
    var outMsg = '';

    if ((newPayload.actions && newPayload.actions[0].name === 'large_text' ) || (newPayload.context.big_text) && newPayload.context.big_text === "true") {
      decision = true;
      console.log(decision);
    }
    if (newPayload.output !== undefined) {
      if (newPayload.output.generic !== undefined) {
        var options = null;

        var preference = 'dropdown';

        for (var i = 0; i < newPayload.output.generic.length; i++) {
          if (newPayload.output.generic[i].options !== undefined) {
            options = newPayload.output.generic[i].options;
          }
          if (newPayload.output.generic[i].preference !== undefined) {
            preference = newPayload.output.generic[i].preference;
          }
        }
        if (options !== null) {
          if (preference === 'dropdown') {
            outMsg += '<ul>';
            for (i = 0; i < options.length; i++) {
              if (options[i].value) {
                outMsg += '<li>' + options[i].label + '</li>';
              }
            }
            outMsg += '</ul>';
          }
          if (preference === 'button') {
            for (let i = 0; i < options.length; i++) {
              if (options[i].value) {
                console.log(preference); 
                outMsg += '<p class="option-buttons" onclick="ConversationPanel.sendMessage(\''  + options[i].value.input.text + '\');" >' + options[i].label + '</p> ';
              }
            }
          }
        }
      }
    }

    textArray[textArray.length - 1] += outMsg;

    var messageArray = [];

    textArray.forEach(function (currentText) {
      console.log(decision);
      if (currentText) {
        var messageJson = {
          // <div class='segments'>
          'tagName': 'div',
          'classNames': ['segments'],
          'children': [{
            // <div class='from-user/from-watson latest'>
            'tagName': 'div',
            'classNames': [(isUser ? (decision ? 'from-user' : 'from-user-small') : (decision ? 'from-watson' : 'from-watson-small')), 'latest', ((messageArray.length === 0) ? 'top' : 'sub')],
            'children': [{
              // <div class='message-inner'>
              'tagName': 'div',
              'classNames': [(decision ? 'message-inner': 'message-inner-small')],
              'children': [{
                // <p>{messageText}</p>
                'tagName': 'p',
                'text': currentText
              }]
            }]
          }]
        };
        messageArray.push(Common.buildDomElement(messageJson));
      }
    });

    return messageArray;
  }

  // Scroll to the bottom of the chat window (to the most recent messages)
  // Note: this method will bring the most recent user message into view,
  //   even if the most recent message is from Watson.
  //   This is done so that the "context" of the conversation is maintained in the view,
  //   even if the Watson message is long.
  function scrollToChatBottom(decider) {
    var scrollingChat = document.querySelector('#scrollingChat');

    // Scroll to the latest message sent by the user
    var scrollEl = scrollingChat.querySelector((decider ? '.from-user' : '.from-user-small') + settings.selectors.latest);
    if (scrollEl) {
      scrollingChat.scrollTop = scrollEl.offsetTop;
    }
//     setTimeout(function(){
//       var scrollElS = scrollingChat.querySelector(settings.selectors.fromUserSmall + settings.selectors.latest);
//       if (scrollElS) {
//         scrollingChat.scrollTop = scrollElS.offsetTop;
//       }
// }, 1); 
  }

  // Handles the submission of input
  function inputKeyDown(event, inputBox) {
    // Submit on enter key, dis-allowing blank messages
    if (event.keyCode === 13 && inputBox.value) {
      // Retrieve the context from the previous server response
      var context;
      var latestResponse = Api.getResponsePayload();
      if (latestResponse) {
        context = latestResponse.context;
      }

      // Send the user message
      Api.sendRequest(inputBox.value, context);

      // Clear input box for further messages
      inputBox.value = '';
      Common.fireEvent(inputBox, 'input');
    }
  }
}());