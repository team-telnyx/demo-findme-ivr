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
const telnyx_auth = require("./telnyx-config");
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

// GET - Make sure our APP is running: https://<your_webhook_url>:8081/telnyx-findme/

rest.get(`/${g_appName}`, (req, res) => {
	res.send(`<h1>Telnyx Find Me Follow Me Demo is Running!</h1>`);
});

// POST - Receive Number: https://<your_webhook_url>:8081/telnyx-findme/followme

rest.post(`/${g_appName}/followme`, async (req, res) => {
	if (req && req.body && req.body.data.event_type) {
		var l_hook_event_type = req.body.data.event_type;
		var l_call_control_id = req.body.data.payload.call_control_id;
		var l_client_state_64 = req.body.data.payload.client_state;
	} else {
		console.log(`[%s] LOG - Invalid Webhook received! ${get_timestamp()}`);
		res.end("0");
	}
	// Log the Full Webhook from Telnyx - You cann comment out in a production enviornment
	console.log(req.body.data);

	// If client_state exists decode from base64
	if (l_client_state_64 != null || "")
		var l_client_state_o = JSON.parse(
			Buffer.from(l_client_state_64, "base64").toString("ascii")
		);
	// Call Initiated >> Command Dial
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
		} else if (req.body.data.payload.direction == "outgoing") {
			res.end();
		}

		// Webhook Dial answered by User - Command Gather Using Speak
	} else if (l_hook_event_type == "call.answered") {
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
			// Webhook client_state set to stage-voicemail-greeting, we are able to execute SPEAK which is acting as our Voicemail Greeting
		} else if (l_client_state_o.clientState == "stage-voicemail-greeting") {
			// Supply new client_state to trigger the next function in the flow which is to play beep and record the caller's message
			let l_client_state = {
				clientState: "stage-voicemail",
				bridgeId: null,
			};
			const speak = new telnyx.Call({
				call_control_id: l_call_control_id,
			});
			// Speak our voicemail greeting, you could alternatively record a custom greeting and issue play audio command
			speak.speak({
				payload: "Please Leave a Message After the Tone",
				voice: g_ivr_voice,
				language: g_ivr_language,
				client_state: Buffer.from(
					JSON.stringify(l_client_state)
				).toString("base64"),
			});
			console.log(
				`[%s] LOG - EXEC SPEAK VM GREETING -  [%s] ${get_timestamp()}`
			);
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
	} else if (
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
		// Webhook Call Recording Saved >> Send Text Message of recording
	} else if (l_hook_event_type == "call.recording.saved") {
		//Send Text Message Alert for call recording - Ber sure to enable Link shortener in Telnyx Messaging Profile

		telnyx.messages
			.create({
				from: g_call_control_did, // Your Telnyx number
				to: g_forwarding_did,
				text: `You have a new Voicemail${req.body.data.payload.recording_urls.mp3}`,
			})
			.then(function(response) {
				const message = response.data; // asynchronously handled
			});
		console.log(`[%s] LOG - EXEC SEND SMS -  [%s] ${get_timestamp()}`);

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
