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
require(telnyx);
```

## Telnyx Call Control Basics

For the Call Control application you’ll need to get a set of basic functions to perform Telnyx Call Control Commands. This tutorial will be using the following subset of Telnyx Call Control Commands:

- [Call Control Bridge Calls](https://developers.telnyx.com/docs/api/v2/call-control/Call-Commands#CallControlBridge)
- [Call Control Dial](https://developers.telnyx.com/docs/api/v2/call-control/Call-Commands#CallControlDial)
- [Call Control Speak Text](https://developers.telnyx.com/docs/api/v2/call-control/Call-Commands#CallControlSpeak)
- [Call Control Gather Using Speak](https://developers.telnyx.com/docs/api/v2/call-control/Call-Commands#CallControlGatherUsingSpeak)
- [Call Control Hangup](https://developers.telnyx.com/docs/api/v2/call-control/Call-Commands#CallControlHangup)
- [Call Control Recording Start](https://developers.telnyx.com/docs/api/v2/call-control/Call-Commands#CallControlRecordStart)

You can get the full set of available Telnyx Call Control Commands [here](https://developers.telnyx.com/docs/api/v2/call-control).

For each Telnyx Call Control Command we will be using the Telnyx Node SDK. To execute this API we are using Node `telnyx`, so make sure you have it installed. If not you can install it with the following command:

```shell
$ npm install telnyx --save
```

After that you’ll be able to use ‘telnyx’ as part of your app code as follows:

```js
const Telnyx = require("telnyx");
```

To make use of the Telnyx Call Control Command API you’ll need to set a Telnyx API Key and Secret. 

To check that go to Mission Control Portal and under the `Auth` tab you select `Auth V2`.

Once you have them, you can include it as ‘const’ variable in your code:

```js
const telnyx_auth = require("../telnyx-config-copy");

const telnyx = Telnyx(telnyx_auth.api);
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
Once all dependencies are set, we will use the SDK for each Telnyx Call Control Command. All Commands will follow the similar syntax:

```js

const { data: call } = await telnyx.calls.create({
			connection_id: g_connection_id,
			to: g_forwarding_did,
			from: req.body.data.payload.from,
			client_state: `base64encodedstring`
		});
```

### Understanding the use of the SDK

There are several aspects of the SDK that deserve some attention:

`Input Parameters`: to execute every Telnyx Call Control Command you’ll need to feed your function with the following: the `Call Control ID`; and the input parameters, specific to the body of the Command you’re executing.
```js
const gather = new telnyx.Call({
			call_control_id: l_call_control_id,
		});
gather.gather_using_speak({
				payload: "Call Forwarded press 1 to accept or 2 to reject",
				voice: g_ivr_voice,
				language: g_ivr_language,
				valid_digits: "123",
				client_state: Buffer.from(
					JSON.stringify(l_client_state)
				).toString("base64"),
			});
```
All Telnyx Call Control Commands will be expecting the `Call Control ID` except `Dial`. There you’ll get a new one for the leg generated as response.

In this example you can see that `Call Control ID` is input to the Telnyx Call Object. The command to utilize is then specifed when the new Call Object is called with the input paramters pertaining to that command 


### Telnyx Call Control Commands

This is how every Telnyx Call Control Command used in this application would look like:

#### Call Control Bridge

```js
const bridge_call = new telnyx.Call({
	call_control_id: l_call_control_id,});
	
	bridge_call.bridge({
		call_control_id: l_client_state_o.bridgeId,
	});
```

#### Call Control Dial

```js
const { data: call } = await telnyx.calls.create({
			connection_id: g_connection_id,
			to: g_forwarding_did,
			from: req.body.data.payload.from,
			client_state: Buffer.from(
				JSON.stringify(l_client_state)
			).toString("base64"),
			timeout_secs: "30",
		});
```

#### Call Control Gather Using Speak

```js
const gather = new telnyx.Call({
	call_control_id: l_call_control_id,});

	gather.gather_using_speak({
		payload: "Call Forwarded press 1 to accept or 2 to reject",
		voice: g_ivr_voice,
		language: g_ivr_language,
		valid_digits: "123",
		client_state: Buffer.from(
			JSON.stringify(l_client_state)
		).toString("base64"),
	});
```

#### Call Control Speak

```js
const speak = new telnyx.Call({
	call_control_id: l_call_control_id});
	
	speak.speak({
		payload: "Please Leave a Message After the Tone",
		voice: g_ivr_voice,
		language: g_ivr_language,
		client_state: Buffer.from(
			JSON.stringify(l_client_state)
		).toString("base64"),
	});
```

#### Call Control Hangup

```js
const hangup_call = new telnyx.Call({
	call_control_id: l_call_control_id});
	
	hangup_call.hangup();

```

#### Call Control Recording Start

```js
const record_call = new telnyx.Call({
	call_control_id: l_call_control_id});

	record_call.record_start({
		format: "mp3",
		channels: "single",
		play_beep: true,
		client_state: Buffer.from(JSON.stringify(l_client_state)).toString(
			"base64"
		),});
```

#### SMS Send Notification

```js
telnyx.messages.create({
	from: g_call_control_did, // Your Telnyx number
	to: g_forwarding_did,
	text: `You have a new Voicemail${req.body.data.payload.recording_urls.mp3}`,
	})
	.then(function(response) {
		const message = response.data; // asynchronously handled
	});
```

### Client State

`Client State`: within some of the Telnyx Call Control Commands list we presented, you probably noticed we were including the `Client State` parameter. `Client State` is the key to ensure that we can perform functions only when very specific conditions are met on our App while consuming the same Call Control Events. 

Because Call Control is stateless and async your application will be receiving several events of the same type, e.g. user just included `DTMF`. With `Client State` you enforce a unique ID to be sent back to Telnyx which be used within a particular Command flow and identifying it as being at a specific place in the call flow.

This app in particular will bridge two seperate calls together in the event the user chooses to accept the call. Thus the call_control_id of the pending bridge call must be mapped, and not be risked to being stored in a variable which could be re-assigned while we are waiting for gather response - should a new call be intiated 

#### Build Client State object and Encode to base64
```js
// Build Client State Object
let l_client_state = {
	clientState: "stage-bridge",
	bridgeId: l_call_control_id,
	};

// Object to String and Encode to Base64
Buffer.from(
	JSON.stringify(l_client_state)
	).toString("base64")


// When we receive the hook - If client_state exists decode from base64
if (l_client_state_64 != null || "")
	var l_client_state_o = JSON.parse(
		Buffer.from(l_client_state_64, "base64").toString("ascii")
	);
```


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
rest.post(`/${g_appName}/followme`, async (req, res) => {
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
} else{res.end('0');}
```

Once you identify the `Event Type` and `client_state` received, it’s just a matter of having your application reacting to that. Is the way you react to that Event that helps you creating the IVR logic. What you would be doing is to execute Telnyx Call Control Command as a reaction to those Events.


### `Webhook Call Initiated >> Command Dial`
If our event_type is call.initiated and the direction is incoming we are going to execute the command to Dial the User. After the Dial is executed and we get a new webhook for the dialed call which the direction will be "outgoing," we will execute our 20 second time out function so that the user's mobile voicemail doesn't pick up and we leave an empty message there

```js
if (l_hook_event_type == "call.initiated") {
		// Inbound Call
		if (req.body.data.payload.direction == "incoming") {
			// Format the update to client-state so we can execute call flow and the call control id of the call we may eventually bridge follows in client_state
			let l_client_state = {
				clientState: "stage-bridge",
				bridgeId: l_call_control_id,
			};
			// Dial to our FindMe/FollowMe Destination, forwarding the original CallerID so we can better determine disposition of choice
			const { data: call } = await telnyx.calls.create({
				connection_id: g_connection_id,
				to: g_forwarding_did,
				from: req.body.data.payload.from,
				client_state: Buffer.from(
					JSON.stringify(l_client_state)
				).toString("base64"),
				timeout_secs: "30",
			});
			console.log(
				`[%s] LOG - EXEC DIAL -  [%s] ${get_timestamp()} | ${
					req.body.data.payload.result
				}`
			);
			res.end();

```

### `Webhook Dial Answered >> Command Gather Using Speak`

Once your app is notified by Telnyx that the call was established you want to initiate your IVR. You do that using the Telnyx Call Control Command `Gather Using Speak`, with the IVR  message.

As part of the `Gather Using Speak` Command we indicate that valid digits for the `DTMF` collection are 1 and 2, and that only 1 digit input would be valid. Since we only want to execute this when the call is answered by the user via the dial, we set `client_state` to "stage-bridge" on the `Dial` seen above.

```js
else if (l_hook_event_type == "call.answered") {
		if (l_client_state_o.clientState == "stage-bridge") {
			let l_client_state = {
				clientState: "stage-dial",
				bridgeId: l_client_state_o.bridgeId,
			};
			// Gather Using Speak - Present Menu to Forwading destination, 1 to Accept and Bride Call, 2 to Reject and Send to System Voicemail
			const gather = new telnyx.Call({
				call_control_id: l_call_control_id,
			});
			gather.gather_using_speak({
				payload: "Call Forwarded press 1 to accept or 2 to reject",
				voice: g_ivr_voice,
				language: g_ivr_language,
				valid_digits: "123",
				client_state: Buffer.from(
					JSON.stringify(l_client_state)
				).toString("base64"),
			});
			console.log(`[%s] LOG - EXEC GATHER -  [%s] ${get_timestamp()}`);
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

### `Webhook Listen for DTMF to execute Call Recording on Demand`
We need to be listening for the specified digit in order to execute the recording on demand feature, specifically *. Now this example is very rudimentary and is just for proof of concept. In production, the dtmf should only be received from the user's call leg. Additionally here, we will empty the array once the condition is met and we execute the `Recording Start` Command. We are also re-using this to record are voicemail message.


```js
else if (
		req.body.data.payload.digit === "*" ||
		l_hook_event_type == "call.speak.ended"
	) {
		let l_client_state = {
			clientState: "stage-voicemail-greeting",
			bridgeId: null,
		};
		const record_call = new telnyx.Call({
			call_control_id: l_call_control_id,
		});
		record_call.record_start({
			format: "mp3",
			channels: "single",
			play_beep: true,
			client_state: Buffer.from(JSON.stringify(l_client_state)).toString(
				"base64"
			),
		});
		console.log(
			`[%s] LOG - EXEC RECORD INITIATE -  [%s] ${get_timestamp()}`
		);
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
* `l_call_control_id` The call control id of the latest webhook we just recieved the DTMF on and has a `client_state` of "stage-dial"
* `l_bridge_id` The PSTN caller's call control id, we set that variable to our client state object in `l_client_state.bridgeId` earlier when we first received the webhook on the incoming call.

We've been receiving webhooks for both the original PSTN caller and for the new call we placed via Dial to the user. Both have their own unique call_control_ids, which we will use to bridge both calls together. Here you will witness the importance of `client_state` as we're only executing the bridge on the dial webhook that we set client_state of "stage-dial".

### `Webhook Gather Ended >> Process DTMF for IVR`
```js
 else if (l_hook_event_type == "call.gather.ended") {
		// Receive DTMF Number
		const l_dtmf_number = req.body.data.payload.digits;

		console.log(
			`[%s] DEBUG - RECEIVED DTMF [%s]${get_timestamp()} | ${l_dtmf_number}`
		);
		res.end();

		// Check Users Selection for forwarded call
		if (!l_client_state_64) {
			res.end();
			// Do nothing... will have state
		} else {
			// Selected Answer Call >> Bridge Calls
			if (l_client_state_o.clientState == "stage-dial" && l_dtmf_number) {
				// Bridge Call
				if (l_dtmf_number == "1") {
					const bridge_call = new telnyx.Call({
						call_control_id: l_call_control_id,
					});
					// Bridge this call to the initial call control id which triggered our call flow which we stored in client state on the initial Dial
					bridge_call.bridge({
						call_control_id: l_client_state_o.bridgeId,
					});
					res.end();
					console.log(
						`[%s] LOG - EXEC BRIDGE CALLS -  [%s] ${get_timestamp()}`
					);
					// Call rejected >> Answer Bridge Call, You must answer the parked call before you can issue speak or play audio
				} else if (l_dtmf_number == "2") {
					// Set Call State so we can initiate the voicemail call flow
					let l_client_state = {
						clientState: "stage-voicemail-greeting",
						bridgeId: null,
					};
					const answer_bridge_call = new telnyx.Call({
						call_control_id: l_client_state_o.bridgeId,
					});

					answer_bridge_call.answer({
						client_state: Buffer.from(
							JSON.stringify(l_client_state)
						).toString("base64"),
					});

					// Hangup This call now that user has responded to reject
					const hangup_call = new telnyx.Call({
						call_control_id: l_call_control_id,
					});
					hangup_call.hangup();
					console.log(
						`[%s] LOG - EXEC HANGUP FINDME AND SEND TO VM -  [%s] ${get_timestamp()}`
					);
				}
				res.end();
			}
		}

		res.end();
		// Webhook Speak Ended or * received >> Record VoiceMail / Call
	}
```

### `Webhook Call Recording Saved >> Send Text Message of recording`
We are receiving a webhook of `call.recording.saved` after BOTH a voicemail has been recorded and if a record call on demand has been executed. Now in this web hook we will recieve a link to an mp3 recording of either the voicemail or recorded call. We are going to send an sms notification to the User via sms_send_notification. Optionally, we are using the nodemailer sdk to send an email to the user with the link so they can listen to the message or call.

```js
else if (l_hook_event_type == "call.recording.saved") {
		//Send Text Message Alert for call recording - Ber sure to enable Link shortener in Telnyx Messaging Profile

		telnyx.messages
			.create({
				from: g_call_control_did, // Your Telnyx number
				to: g_forwarding_did,
				text: `You have a new Recording ${req.body.data.payload.recording_urls.mp3}`,
			})
			.then(function(response) {
				const message = response.data; // asynchronously handled
			});
		console.log(`[%s] LOG - EXEC SEND SMS -  [%s] ${get_timestamp()}`);

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



