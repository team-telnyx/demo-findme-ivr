# Telnyx Find Me/Follow Me Demo
Telnyx Find Me/Follow Me demo built on Call Control and node.js.


In this tutorial, you’ll learn how to:

1. Set up your development environment to use Telnyx Call Control using Node.
2. Build a Find Me/Follow Me based app via IVR on Telnyx Call Control using Node.


---

- [Prerequisites](#prerequisites)
- [Telnyx Call Control Basics](#telnyx-call-control-basics)
  - [Understanding the Command Syntax](#understanding-the-command-syntax)
  - [Telnyx Call Control Commands](#telnyx-call-control-commands)
- [Building Find Me Follow Me IVR](#building-find-me-follow-me-ivr)
- [Lightning-Up the Application](#lightning-up-the-application)


---

## Prerequisites

Before you get started, you’ll need to complete these steps:

1. Have a Telnyx account, that you can create [here](https://telnyx.com/sign-up) 
2. Buy a Telnyx number on Mission Portal, that you can learn how to do [here](https://developers.telnyx.com/docs/v2/numbers/quickstarts/portal-setup)
3. Create a new Connection as Call Control on Mission Portal, that you can learn how to do [here](https://developers.telnyx.com/docs/v2/call-control/quickstart).
4. You’ll need to have `node` installed to continue. You can check this by running the following:

```shell
$ node -v
```

If Node isn’t installed, follow the [official installation instructions](https://nodejs.org/en/download/) for your operating system to install it.

You’ll need to have the following Node dependencies installed for the Call Control API:

```js
require(express);
require(request);
```

## Telnyx Call Control Basics

For the Call Control application you’ll need to get a set of basic functions to perform Telnyx Call Control Commands. This tutorial will be using the following subset of Telnyx Call Control Commands:

- [Call Control Bridge Calls](https://developers.telnyx.com/docs/api/v2/call-control/Call-Commands#CallControlBridge)
- [Call Control Dial](https://developers.telnyx.com/docs/api/v2/call-control/Call-Commands#CallControlDial)
- [Call Control Speak Text](https://developers.telnyx.com/docs/api/v2/call-control/Call-Commands#CallControlSpeak)
- [Call Control Gather Using Speak](https://developers.telnyx.com/docs/api/v2/call-control/Call-Commands#CallControlGatherUsingSpeak)
- [Call Control Hangup](https://developers.telnyx.com/docs/api/v1/call-control/Call-Commands#CallControlHangup)
- [Call Control Recording Start](https://developers.telnyx.com/docs/api/v2/call-control/Call-Commands#CallControlRecordStart)

You can get the full set of available Telnyx Call Control Commands [here](https://developers.telnyx.com/docs/api/v2/call-control).

For each Telnyx Call Control Command we will be creating a function that will execute an `HTTP POST` Request to back to Telnyx server.  To execute this API we are using Node `request`, so make sure you have it installed. If not you can install it with the following command:

```shell
$ npm install request --save
```

After that you’ll be able to use ‘request’ as part of your app code as follows:

```js
var request = require('request');
```

To make use of the Telnyx Call Control Command API you’ll need to set a Telnyx API Key and Secret. 

To check that go to Mission Control Portal and under the `Auth` tab you select `Auth V2`.

Once you have them, you can include it as ‘const’ variable in your code:

```js
const g_telnyx_api_auth_v2 = telnyx_auth.api;
```

We have a number of secure credentials to work with we created an additional file `telnyx-config` to store this information. Here we will store our API Key as well as our connection ID, the DID associated with that connection and the PSTN DID we will send calls to.

```js
const telnyx_config = {
	api: "YOURAPIV2KEYgoeshere",
        connection_id: "1110011011",
        telnyx_did: "+18888675309",
	c_fwd_number: "+13128675309",

};

module.exports = telnyx_config;


```
Once all dependencies are set, we can create a function for each Telnyx Call Control Command. All Commands will follow the same syntax:

```js

const call_control_COMMAND_NAME = (f_call_control_id, f_INPUT1, ...) => {
	
	var l_cc_action = ‘COMMAND_NAME’

	var options = {
		url: `https://api.telnyx.com/v2/calls/${f_call_control_id}/actions/${l_cc_action}`,
		headers: f_post_headers,
		json: {
			call_control_id: f_call_control_id
		}
	};

	request.post(options, function(err, resp, body) {
		if (err) {
			return console.log(err);
		}
	
	});
}
```
We are saving some space by storing our post headers in a varible and passing them as a parameter in the function as they do not change
```js
const g_post_headers = {
	"Content-Type": "application/json",
	Accept: "application/json",
	Authorization: `Bearer ${g_telnyx_api_auth_v2}`
};

```

### Understanding the Command Syntax

There are several aspects of this function that deserve some attention:

`Function Input Parameters`: to execute every Telnyx Call Control Command you’ll need to feed your function with the following: the `Call Control ID`; and the input parameters, specific to the body of the Command you’re executing. Having these set as function input parameters will make it generic enough to reuse in different use cases:
```js
const call_control_COMMAND_NAME = (f_call_control_id, f_INPUT1, ...)
```
All Telnyx Call Control Commands will be expecting the `Call Control ID` except `Dial`. There you’ll get a new one for the leg generated as response.

`Name of the Call Control Command`: as detailed [here](https://developers.telnyx.com/docs/api/v2/call-control/), the Command name is part of the API URL. In our code we call that the `action` name, and will feed the POST Request URL later:
```js
var cc_action = ‘COMMAND_NAME’
```

`Building the Telnyx Call Control Command`: once you have the Command name defined, you should have all the necessary info to build the complete Telnyx Call Control Command:
```js
var options = {
    url: `https://api.telnyx.com/v2/calls/${f_call_control_id}/actions/${l_cc_action}`,
    headers: f_post_headers,
    json: {
        call_control_id: f_call_control_id
    }
};
```
In this example you can see that `Call Control ID` and the Action name will feed the URL of the API, both Telnyx Key and Telnyx Secret feed the Authentication headers, and the body will be formed with all the different input parameters  received for that specific Command. 


`Calling the Telnyx Call Control Command`: Having the request  `headers` and `options`/`body` set, the only thing left is to execute the `POST Request` to execute the command. 
For that we are using making use of the node's `request` module:
```js
 request.post(options,function(err,resp,body){
    if (err) { return console.log(err); }
});  
```

### Telnyx Call Control Commands

This is how every Telnyx Call Control Command used in this application would look like:

#### Call Control Bridge

```js
const call_control_bridge = (f_post_headers, f_call_control_id, f_bridge_id) => {
	
	var l_cc_action = "bridge";

	var options = {
		url: `https://api.telnyx.com/v2/calls/${f_call_control_id}/actions/${l_cc_action}`,
		headers: f_post_headers,
		json: {
			call_control_id: f_bridge_id
		}
	};

	request.post(options, function(err, resp, body) {
		if (err) {
			return console.log(err);
		}
	});
}
```

#### Call Control Dial

```js
const call_control_dial = (
	f_post_headers,
	f_connection_id,
	f_dest,
	f_orig,
	f_client_state_s
) => {
	var l_cc_action = "dial";

	var l_client_state_64 = null;

	if (f_client_state_s)
		l_client_state_64 = Buffer.from(f_client_state_s).toString("base64");

	var options = {
		url: `https://api.telnyx.com/v2/calls/`,
		headers: f_post_headers,
		json: {
			connection_id: f_connection_id,
			to: f_dest,
			from: f_orig,
			client_state: l_client_state_64
		}
	};

	request.post(options, function(err, resp, body) {
		if (err) {
			return console.log(err);
		}
	});
}
```

#### Call Control Gather Using Speak

```js
const call_control_gather_using_speak = (
	f_post_headers,
	f_call_control_id,
	f_tts_text,
	f_gather_digits,
	f_client_state_s
) => {
	
	var l_cc_action = "gather_using_speak";
	var l_client_state_64 = null;

	if (f_client_state_s)
		l_client_state_64 = Buffer.from(f_client_state_s).toString("base64");

	var options = {
		url: `https://api.telnyx.com/v2/calls/${f_call_control_id}/actions/${l_cc_action}`,
		headers: f_post_headers,
		json: {
			payload: f_tts_text,
			voice: g_ivr_voice,
			language: g_ivr_language,
			valid_digits: f_gather_digits,
			client_state: l_client_state_64
		}
	};

	request.post(options, function(err, resp, body) {
		if (err) {
			return console.log(err);
		}
		console.log(
			"[%s] DEBUG - Command Executed [%s]",
			get_timestamp(),
			l_cc_action
		);
		console.log(body);
	});
};  
}
```

#### Call Control Speak

```js
const call_control_speak = (
	f_post_headers,
	f_call_control_id,
	f_tts_text,
	f_client_state_s
) => {
	var l_cc_action = "speak";
	if (f_client_state_s)
		l_client_state_64 = Buffer.from(f_client_state_s).toString("base64");

	var options = {
		url: `https://api.telnyx.com/v2/calls/${f_call_control_id}/actions/${l_cc_action}`,
		headers: f_post_headers,
		json: {
			payload: f_tts_text,
			voice: g_ivr_voice,
			language: g_ivr_language,
			client_state: l_client_state_64,
			command_id: "blahblah-f3e4-11e8-af5b-de00688a4901"
		}
	};

	request.post(options, function(err, resp, body) {
		if (err) {
			return console.log(err);
		}
	});
};
```

#### Call Control Hangup

```js
const call_control_hangup = (f_post_headers, f_call_control_id) => {

	var l_cc_action = "hangup";

	var options = {
		url: `https://api.telnyx.com/v2/calls/${f_call_control_id}/actions/${l_cc_action}`,
		headers: f_post_headers,
		json: {}
	};

	request.post(options, function(err, resp, body) {
		if (err) {
			return console.log(err);
		}
	});
};

```

#### Call Control Recording Start

```js
const call_control_record_start = (f_post_headers, f_call_control_id) => {

	var l_cc_action = "record_start";

	var options = {
		url: `https://api.telnyx.com/v2/calls/${f_call_control_id}/actions/${l_cc_action}`,
		headers: f_post_headers,
		json: {
			format: "mp3",
			channels: "single",
			play_beep: true
		}
	};

	request.post(options, function(err, resp, body) {
		if (err) {
			return console.log(err);
		}
	});
};

```

#### SMS Send Notification

```js
const sms_send_notification = f_post_headers => {

	const options = {
		url: "https://api.telnyx.com/v2/messages",
		headers: f_post_headers,
		json: {
			from: g_call_control_did,
			to: g_forwarding_did,
			text: `You have a new voicemail available `
		}
	};

	request.post(options, (err, resp, body) => {
		if (err) {
			return console.log(err);
		}
	});
};

```

`Client State`: within some of the Telnyx Call Control Commands list we presented, you probably noticed we were including the `Client State` parameter. `Client State` is the key to ensure that we can perform functions only when very specific conditions are met on our App while consuming the same Call Control Events. 

Because Call Control is stateless and async your application will be receiving several events of the same type, e.g. user just included `DTMF`. With `Client State` you enforce a unique ID to be sent back to Telnyx which be used within a particular Command flow and identifying it as being at a specific place in the call flow.


## Building Find Me Follow Me IVR


With all the basic Telnyx Call Control Commands set, we are ready to consume them and put them in the order that will create the IVR. For this tutorial we want to keep it simple with a flow that corresponds to the following IVR Logic:

1. Allow the incoming call to be parked
2. Execute dial function to the user's PSTN number
3. Present an IVR allowing them to Accept or Reject the call
    * Execute a 20 second TimeOut to hangup for no answer
4. When the user answers, they will be met with an IVR Greeting:
    * Press 1 to Accept the Call - The Parked Call and this Dialed call will now be Bridged. The Timeout to Hangup the Dial call to user will be cleared.
    * Press 2 to Reject the call - The Dialed Call will hang up. The Parked call will enter the Voicemail Functionality via Speak and Recording Start
    * At any time during the caller, the user can press *9 to initiate on demand call recording.
5. An SMS notification will be sent to the user to notify them of a call recording or voicemail message. (Optionally) - the nodemailer function will send an email to the user with a link to download and listen to the recording




<p align="center">
    <img src="https://github.com/team-telnyx/demo-findme-ivr/blob/master/find_me.png" width="90%" height="90%" title="find_me_example">
</p>


To exemplify this process we created a simple API call that will be exposed as the webhook in Mission Portal. For that we would be using `express`:

```shell
$ npm install request --save
```

With `express` we can create an API wrapper that uses `HTTP GET` to call our Request Token method:

```js
rest.post(`/${g_appName}/followme`, (req, res) => {
  // APP CODE GOES HERE  
})
```

This would expose a webhook like the following: 

    http://MY_DOMAIN_URL/telnyx-findme/followme

You probably noticed that `g_appName` in  the previous point. That is part of a set of global variables we are defining with a certain set of info we know we are going to use in this app: TTS parameters, like voice and language to be used and IVR redirecting contact points. 

You can set these at the beginning of your code:

```js
// Application:
const g_appName = "telnyx-findme";
// Store DTMF to initiate functions
var g_call_control_options = [];

// TTS Options
const g_ivr_voice = "female";
const g_ivr_language = "en-GB";

```

With that set, we can fill in that space that we named as `APP CODE GOES HERE`. So as you expose the URL created as Webhook in Mission Control associated with your number, you’ll start receiving all call events for that call. 

So the first thing to be done is to identify the kind of event you just received and extract the `Call Control Id` and `Client State` (if defined previously):

```js
if (req && req.body && req.body.event_type){
   	if (req && req.body && req.body.data.event_type) {
		var l_hook_event_type = req.body.data.event_type;
		var l_call_control_id = req.body.data.payload.call_control_id;
		var l_client_state_64 = req.body.data.payload.client_state;
		var l_call_state = req.body.data.payload.state;
} else{res.end('0');}
```

Once you identify the `Event Type` and `Call State` received, it’s just a matter of having your application reacting to that. Is the way you react to that Event that helps you creating the IVR logic. What you would be doing is to execute Telnyx Call Control Command as a reaction to those Events.

### `Webhook Call State = Park >> Store Call Control ID >>> Bridge ID`

```js
if (l_call_state == "parked") {
    l_bridge_id = l_call_control_id;
    console.log(
        `[%s] LOG - Webhook received - Parked call_control_id > bridge_id [%s] ${get_timestamp()} | ${l_bridge_id}`
    );
}
```

### `Webhook Call Initiated >> Command Dial`
If our event_type is call.initiated and the direction is incoming we are going to execute the command to Dial the User. After the Dial is executed and we get a new webhook for the dialed call which the direction will be "outgoing," we will execute our 20 second time out function so that the user's mobile voicemail doesn't pick up and we leave an empty message there

```js
if (l_hook_event_type == "call.initiated") {
    if (req.body.data.payload.direction == "incoming") {
        call_control_dial(
            g_post_headers,
            g_connection_id,
            g_forwarding_did,
            req.body.data.payload.from,
            "stage-bridge"
        );
    } else if (req.body.data.payload.direction == "outgoing") {
        // Timeout 20 seconds - No Answer thus emppty message does not end up in cell phone voicemail
        timeout_to_vm = setTimeout(
            call_control_speak,
            20000,
            g_post_headers,
            l_call_control_id,
            l_bridge_id,
            "Please Leave a Message After the Tone",
            "stage-voicemail"
        );
        res.end();
    }

    res.end();

```

### `Webhook Dial Answered >> Command Gather Using Speak`

Once your app is notified by Telnyx that the call was established you want to initiate your IVR. You do that using the Telnyx Call Control Command `Gather Using Speak`, with the IVR  message.

As part of the `Gather Using Speak` Command we indicate that valid digits for the `DTMF` collection are 1 and 2, and that only 1 digit input would be valid. Since we only want to execute this when the call is answered by the user via the dial, we set `client_state` to "stage-bridge" on the `Dial` seen above.

```js
else if (l_hook_event_type == "call.answered") {
		if (l_client_state_s == "stage-bridge")
			call_control_gather_using_speak(
				g_post_headers,
				l_call_control_id,
				`Call Forwarded press 1 to accept or 2 to reject`,
				"123",
				"stage-dial"
			);

		res.end();
}
```


*Important Note: For consistency Telnyx Call Control engine requires every single Webhook to be replied by the Webhook end-point, otherwise will keep trying. For that reason we have to be ready to consume every Webhook we expect to receive and reply with `200 OK`.*

### `Webhook Call Bridged >> Do Nothing`
Your app will be informed that the call was bridged should the user choose to accept the call. For the APP we are doing nothing with that info, but we will need to reply to that command. 


```js
else if (l_hook_event_type == call_bridged){
 res.end();
}
```
### `Webhook Speak Started >> Do Nothing`
```js
 else if (l_hook_event_type == "call.speak.started") {
		res.end();
}
```
### `Webhook Call Hangup >> Clear DTMF Call Control Options`
When the call is hung up we want to clear out the array which stores the specified dtmf digits which enable call recording demand
```js
  else if (l_hook_event_type == "call.hangup") {
		g_call_control_options = [];
		res.end();s.end();
}
```
### `Webhook Listen for DTMF to execute Call Recording on Demand`
We need to be listening for the specified digits in order to execute the recording on demand feature, specifically *9. Now this example is very rudimentary and is just for proof of concept. In production, the dtmf should only be received from the user's call leg. Additionally here, we will empty the array once the condition is met and we execute the `Recording Start` Command


```js
else if (l_hook_event_type == "call.dtmf.received") {
		
		if (
			req.body.data.payload.digit === "*" ||
			req.body.data.payload.digit === "9"
		) {
			// Push digits to array for storage
			g_call_control_options.push(req.body.data.payload.digit);
			console.log(
				`CCarray ${g_call_control_options} - ${g_call_control_options.length}`
			);
			// When accepted digits have been pushed to array & array.length = 2 >> Record Call
			if (g_call_control_options.length === 2) {
				console.log("record call");
				call_control_record_start(
					g_post_headers,
					l_call_control_id,
				);
				// Empty Array for use on next command
				g_call_control_options = [];
			}
			res.end();
		}
		res.end();
	} 
```
*Important Note: With DTMF, you will recieve both dtmf in the payload of webhooks for both `call.gather.ended` and `call.dtmf.received`. The main difference is that in the gather webhooks dtmf will be sent as value to key "digits" and in dtmf.received the key will be "digit."*

### `Webhook Gather Ended >> Find Me IVR Logic`
It’s when you receive the Webhook informing your application that Call Control `Gather Ended` (DTMF input) that the IVR magic happens:

We're doing a number of things here. 
1. If the user presses 1, we are first going to clear the timeout for this Dialed call so it does not hangup automatically. Second, we are going to issue "bridge" to connect the caller and the user.
2. If the user presses 2, we are going to do execute two commands. We will speak the voicemail greeting to the caller, and issue hangup to the users mobile.

In order to bridge the calls. We need both the call_control_id for this Dialed Call and the call_control_id PSTN Caller. Thus is the call_control_bridge function you see we are passing. 
* `l_call_control_id` The call control id of the latest webhook we just recieved the DTMF on and has a `call_state` of "stage-dial"
* `l_bridge_id` The PSTN caller's call control id, we set that varibale earlier when we first received the webhook on the incominng call that had a `call_state` of "parked."
```js
if (l_call_state == "parked") {
		l_bridge_id = l_call_control_id;
		console.log(
			`[%s] LOG - Webhook received - Parked call_control_id > bridge_id [%s] ${get_timestamp()} | ${l_bridge_id}`
		);
	}

```
We've been receiving webhooks for both the original PSTN caller and for the new call we placed via Dial to the user. Both have their own unique call_control_ids, which we will use to bridge both calls together. Here you will witness the importance of `client_state` as we're only executing the bridge on the dial webhook that we set client_state of "stage-dial".

### `// Webhook Gather Ended >> Process DTMF for IVR `
```js
else if (l_hook_event_type == "call.gather.ended") {
		// Receive DTMF Number
		var l_dtmf_number = req.body.data.payload.digits;
		// Check Users Selection for forwarded call
		if (!l_client_state_64) {
			// do nothing... will have state
		} else {
			// Selected Answer Call >> Bridge Calls
			if (l_client_state_s == "stage-dial" && l_dtmf_number) {
				// Bridge Call
				if (l_dtmf_number == "1") {
					// Clear Timeout - Call Has been answered
					clearTimeout(timeout_to_vm);
					// Bridge Call
					call_control_bridge(
						g_post_headers,
						l_call_control_id,
						l_bridge_id
					);
					// Call rejected >> Speak Message and Hang up this call
				} else if (l_dtmf_number == "2") {
					call_control_speak(
						g_post_headers,
						l_call_control_id,
						l_bridge_id,
						"Please Leave a Message After the Tone",
						"stage-voicemail"
					);
				}
			}
		}

		res.end();
```
### `Webhook Speak Ended >> Record Voicemail`
Speak and Gather Using Speak are two different commands. We are receiving a webhook of `call.speak.ended` after the voicemail greeting has been played. Now we want to issuse call_control_record_start to record the PSTN Caller's Message 

```js
else if (l_hook_event_type == "call.speak.ended") {
		call_control_record_start(
			g_post_headers,
			l_call_control_id,
		);

		res.end();
```

### `Webhook Call Recording Saved >> Send Text Message of recording`
We are receiving a webhook of `call.recording.saved` after BOTH a voicemail has been recorded and if a record call on demand has been executed. Now in this web hook we will recieve a link to an mp3 recording of either the voicemail or recorded call. We are going to send an sms notification to the User via sms_send_notification. Optionally, we are using the nodemailer sdk to send an email to the user with the link so they can listen to the message or call.

```js
else if (l_hook_event_type == "call.recording.saved") {
		//Send Text Message Alert for call recording
		sms_send_notification(g_post_headers);
		// Send Email with link to recording
		send_email(
			req.body.data.payload.recording_urls.mp3,
			g_smtp_user,
			g_smtp_user,
			g_recordings_email
		).catch(console.error);
		res.end();
	}
```

## Lightning-Up the Application
Finally the last piece of the puzzle is having your application listening for Telnyx Webhooks:

```js
const PORT = 8081;
rest.listen(PORT, () => {
	console.log(
		`SERVER ${get_timestamp()} -  app listening at http://localhost:${PORT}/${g_appName}`
	);
});

})
```

And start the application by executing the following command:

```shell
$ npm run dev
```



