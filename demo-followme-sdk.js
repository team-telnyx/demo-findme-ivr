// ============================================== Telnyx Find Me Follow Me Demo =========================================

// Description:
// This app is creating functionality similar to that of Find Me / Follow Me  Call Forwarding

// Stetphen Malito (stephenm@telnyx.com)

// Application:
const g_appName = "telnyx-findme";

// TTS Options
const g_ivr_voice = "female";
const g_ivr_language = "en-GB";

// ======= Conventions =======
// = g_xxx: global variable
// = f_xxx: function variable
// = l_xxx: local variable
// ===========================

// ================================================ Dependencies =======================================================

const express = require("express");
const Telnyx = require("telnyx");

// =============================================== Telnyx Account Details ==============================================
// Storing all our secure credentials and information in telnyx_auth
const telnyx_auth = require("./telnyx-config-copy");
// Telnyx ApiV2 Key
const telnyx = Telnyx(telnyx_auth.api);
// Connection ID to place outbound Dial on
const g_connection_id = telnyx_auth.connection_id;
// Phone number we will try to connect with
const g_forwarding_did = telnyx_auth.c_fwd_number;
// Telnyx DID configured for this App in Mission Control
const g_call_control_did = telnyx_auth.telnyx_did;

// ================================================ RESTful API Creation ================================================

const rest = express();

rest.use(express.json());

// ================================================ AUXILIARY FUNCTIONS  ================================================

// Generate Timestamp
const get_timestamp = () => {
	var now = new Date();

	return (
		"utc|" +
		now.getUTCFullYear() +
		"/" +
		(now.getUTCMonth() + 1) +
		"/" +
		now.getUTCDate() +
		"|" +
		now.getHours() +
		":" +
		now.getMinutes() +
		":" +
		now.getSeconds() +
		":" +
		now.getMilliseconds()
	);
};

// ================================================    WEBHOOK API IVR   ================================================

// POST - Receive Number: https://<your_webhook_url>:8081/telnyx-findme/followme

rest.get("/telnyx-findme", (req, res) => {
	res.send(`<h1>Telnyx APIv2 Follow Me Demo is Running!</h1>`);
});

rest.post(`/${g_appName}/followme`, async (req, res) => {
	if (req && req.body && req.body.data.event_type) {
		var l_hook_event_type = req.body.data.event_type;
		var l_call_control_id = req.body.data.payload.call_control_id;
		var l_client_state_64 = req.body.data.payload.client_state;
		var l_call_state = req.body.data.payload.state;
		let l_client_state_s = "";
		let l_bridge_id = "";
	} else {
		console.log(`[%s] LOG - Invalid Webhook received! ${get_timestamp()}`);
		res.end("0");
	}
	console.log(req.body.data);
	// If client_state exists decode from base64
	if (l_client_state_64 != null || "") {
		let l_client_state_d = Buffer.from(
			l_client_state_64,
			"base64"
		).toString("ascii");
		// String -> Object
		let l_client_state_o = JSON.parse(l_client_state_d);
		//Parsed from Object for use
		l_client_state_s = l_client_state_o.clientState;
		l_bridge_id = l_client_state_o.bridgeId;
		console.log(
			`[%s] LOG - Webhook received - ${get_timestamp()} 
			client_state | ${l_client_state_s}
			bridge_id | ${l_bridge_id}
			
			------------------------------`
		);
	}

	// Call Initiated >> Command Dial
	if (l_hook_event_type == "call.initiated") {
		console.log("initiate");
		if (req.body.data.payload.direction == "incoming") {
			console.log("incoming");
			// Dial IVR Present Menu to Accept or Reject, if no answer in 30 seconds - Timeoute and Hangup
			let call_state = {
				clientState: "stage-bridge",
				bridgeId: l_call_control_id,
			};

			const { data: call } = await telnyx.calls.create({
				connection_id: g_connection_id,
				to: g_forwarding_did,
				from: req.body.data.payload.from,
				client_state: Buffer.from(JSON.stringify(call_state)).toString(
					"base64"
				),
				timeout_secs: "30",
			});

			res.end();
		} else if (req.body.data.payload.direction == "outgoing") {
			res.end();
		}

		// Webhook Dial answered by User - Command Gather Using Speak
	} else if (l_hook_event_type == "call.answered") {
		console.log(`Answered - Client_state:${l_client_state_s}`);
		if (l_client_state_s == "stage-bridge") {
			console.log("SPEAK");
			let call_state = {
				clientState: "stage-dial",
				bridgeId: l_bridge_id,
			};

			const call = new telnyx.Call({
				call_control_id: l_call_control_id,
			});
			call.gather_using_speak({
				payload: "Call Forwarded press 1 to accept or 2 to reject",
				voice: g_ivr_voice,
				language: g_ivr_language,
				valid_digits: "123",
				client_state: Buffer.from(JSON.stringify(call_state)).toString(
					"base64"
				),
			});
			res.end();
		} else if (l_client_state_s == "stage-voicemail-greeting"){
			console.log("SPEAK VOICEMAIL GREETING")
			let call_state = {
				clientState: "stage-voicemail",
				bridgeId: null,
			};
			const speak_call = new telnyx.Call({
				call_control_id: l_call_control_id,
			});
			speak_call.speak({
				payload: "Please Leave a Message After the Tone",
				voice: g_ivr_voice,
				language: g_ivr_language,
				client_state: Buffer.from(
					JSON.stringify(call_state)
				).toString("base64")
			});

		} else {
			res.end();
		}
		res.end();

		// Webhook Call Bridged or Speak Started >> Do Nothing
	} else if (
		l_hook_event_type == "call.bridged" ||
		l_hook_event_type == "call.speak.started"
	) {
		res.end();
		// Webhook Call Hungup Started >> Do Nothing
	} else if (l_hook_event_type == "call.hangup") {
		res.end();
		// Find Me / Follow me - handle DTMF to Bridge or Send to Voicemail
	} else if (l_hook_event_type == "call.gather.ended") {
		// Receive DTMF Number
		const l_dtmf_number = req.body.data.payload.digits;

		console.log(
			`[%s] DEBUG - RECEIVED DTMF [%s]${(get_timestamp(), l_dtmf_number)}`
		);
		res.end();

		// Check Users Selection for forwarded call
		if (!l_client_state_64) {
			res.end();
			// do nothing... will have state
		} else {
			// Selected Answer Call >> Bridge Calls
			if (l_client_state_s == "stage-dial" && l_dtmf_number) {
				// Bridge Call
				console.log(`DTMF RECIEVED: ${l_dtmf_number}`);
				if (l_dtmf_number == "1") {
					// Bridge Call
					const call = new telnyx.Call({
						call_control_id: l_call_control_id,
					});
					call.bridge({ call_control_id: l_bridge_id });
					res.end();
					console.log("Call Bridged");
					// Call rejected >> Answer Bridge Call, Speak Message and Hang up this call
				} else if (l_dtmf_number == "2") {
					console.log("SEND TO VM");
					// Answer Bridge Call
					let call_state = {
						clientState: "stage-voicemail-greeting",
						bridgeId: null,
					};
					const answer_bridge_call = new telnyx.Call({
						call_control_id: l_bridge_id,
					});

					answer_bridge_call.answer({client_state: Buffer.from(
						JSON.stringify(call_state)
					).toString("base64")});
					// Set Client State
					
					// Hangup This call
					const hangup_call = new telnyx.Call({
						call_control_id: l_call_control_id
					});
					hangup_call.hangup();

					
				}
				res.end();
			}
		}

		res.end();
		// Webhook Speak Ended >> Record VoiceMail
	} else if (
		req.body.data.payload.digit === "*" ||
		l_hook_event_type == "call.speak.ended"
	) {
		console.log("RECORD CALL")
		const call = new telnyx.Call({
			call_control_id: l_call_control_id
		});
		call.record_start({ format: "mp3", channels: "single", play_beep: true });
		res.end();
		// Webhook Call Recording Saved >> Send Text Message of recording
	} else if (l_hook_event_type == "call.recording.saved") {
		//Send Text Message Alert for call recording

		// telnyx.messages
		// 	.create({
		// 		from: g_call_control_did, // Your Telnyx number
		// 		to: g_forwarding_did,
		// 		text: req.body.data.payload.recording_urls.mp3,
		// 	})
		// 	.then(function(response) {
		// 		const message = response.data; // asynchronously handled
		// 	});
		console.log("SEND SMS");

		res.end();
	}
	res.end();
});

// ================================================ RESTful Server Start ================================================

const PORT = 8081;
rest.listen(PORT, () => {
	console.log(
		`SERVER ${get_timestamp()} -  app listening at http://localhost:${PORT}/${g_appName}`
	);
});
