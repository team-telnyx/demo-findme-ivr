// ============================================== Telnyx Find Me Follow Me Demo =========================================

// Description:
// This app is creating functionality similar to that of Find Me / Follow Me  Call Forwarding

// Stetphen Malito (stephenm@telnyx.com)

// Application:
const g_appName = "telnyx-findme";
// Store DTMF to initiate functions
var g_call_control_options = [];
// timeout_to_vm


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
const request = require("request");

// =============================================== Telnyx Account Details ==============================================
// Storing all our secure credentials and information in telnyx_auth
const telnyx_auth = require("./telnyx-config");
// Telnyx ApiV2 Key
const g_telnyx_api_auth_v2 = telnyx_auth.api;
// Connection ID to place outbound Dial on
const g_connection_id = telnyx_auth.connection_id;
// Phone number we will try to connect with
const g_forwarding_did = telnyx_auth.c_fwd_number;
// Telnyx DID configured for this App in Mission Control
const g_call_control_did = telnyx_auth.telnyx_did;

// DRY - Post Request Headers
const g_post_headers = {
	"Content-Type": "application/json",
	Accept: "application/json",
	Authorization: `Bearer ${g_telnyx_api_auth_v2}`
};

// =============================================== Optional E-Mail Int ===========================================
// Nodemailer SDK - Info: https://nodemailer.com/about/
const nodemailer = require("nodemailer");
// User's Email Address
const g_recordings_email = telnyx_auth.user_email;
// Email Sender Account Address
const g_smtp_user = telnyx_auth.smtp_user;
// Enail Sender Account Password
const g_smtp_pass = telnyx_auth.smtp_pass;

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

// ================================================ TELNYX COMMANDS API  ================================================

// Call Control - Bridge
const call_control_bridge = (
	f_post_headers,
	f_call_control_id,
	f_bridge_id
) => {
	console.log("[%s] LOG - Bridge!", get_timestamp());
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
		console.log(
			"[%s] DEBUG - Command Executed [%s]",
			get_timestamp(),
			l_cc_action
		);
		console.log(body);
	});
};

// Call Control - Dial
const call_control_dial = (
	f_post_headers,
	f_connection_id,
	f_dest,
	f_orig,
	f_client_state_s
) => {
	console.log("[%s] LOG - DIAL!", get_timestamp());
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
		console.log(
			"[%s] DEBUG - Command Executed [%s]",
			get_timestamp(),
			l_cc_action
		);
		console.log(body);
	});
};

// Call Control - Gather Using Speak
const call_control_gather_using_speak = (
	f_post_headers,
	f_call_control_id,
	f_tts_text,
	f_gather_digits,
	f_client_state_s
) => {
	console.log(`[%s] LOG - Gather Using Speak! ${get_timestamp()}`);
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
// Call Control - Speak
const call_control_speak = (
	f_post_headers,
	f_dial_cancel_control_id,
	f_call_control_id,
	f_tts_text,
	f_client_state_s
) => {
	console.log("[%s] LOG - SPEAK!", get_timestamp());
	call_control_hangup(f_post_headers, f_dial_cancel_control_id);
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
			command_id: "891510ac-f3e4-11e8-af5b-de00688a4901"
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
// Call Control - Hangup
const call_control_hangup = (f_post_headers, f_call_control_id) => {
	console.log(`[%s] LOG - Hangup! ${get_timestamp()}`);

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
		console.log(
			`[%s] DEBUG - Command Executed [%s]",
			${get_timestamp()} | ${l_cc_action}
		`
		);
		console.log(body);
	});
};

// Call Control - Recording Start
const call_control_record_start = (f_post_headers, f_call_control_id) => {
	console.log(`[%s] LOG - RECORD! ${get_timestamp()}`);
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
		console.log(
			"[%s] DEBUG - Command Executed [%s]",
			get_timestamp(),
			l_cc_action
		);
		console.log(body);
	});
};

// Send Text - Voicemail Notification
const sms_send_notification = f_post_headers => {
	console.log(`"[%s] LOG - TEXT!" ${get_timestamp()}`);
	const l_cc_action = "sendtext";

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
		console.log(
			"[%s] DEBUG - Command Executed [%s]",
			get_timestamp(),
			l_cc_action
		);
		console.log(body);
	});
};
//  ========== Optional ========== Send Email of Call Recording =====================================
const send_email = async (
	f_recording_link,
	f_smtp_user,
	f_smtp_pass,
	f_recordings_email
) => {
	console.log(`"[%s] LOG - SEND EMAIL!" ${get_timestamp()}`);
	// create reusable transporter object using the default SMTP transport
	let transporter = nodemailer.createTransport({
		host: "smtp.ethereal.email",
		port: 587,
		secure: false, // true for 465, false for other ports
		auth: {
			user: f_smtp_user,
			pass: f_smtp_pass
		}
	});

	// Send email with link to call recording
	let info = await transporter.sendMail({
		from: '"TelNyx Recordings" <foo@example.com>', // sender address
		to: `${f_recordings_email}`, // list of receivers
		subject: "New Recording", // Subject line
		text: "H", // plain text body
		html: `
		<b>New recording available:</b>
		<br>
		<a href="${f_recording_link}">Download your recording</a>`
	});

	console.log("Message sent: %s", info.messageId);
	// Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

	// Preview only available when sending through an Ethereal account
	console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
	// Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
};

// ================================================    WEBHOOK API IVR   ================================================

// POST - Receive Number: https://<your_webhook_url>:8081/telnyx-findme/followme

rest.get("/telnyx-findme", (req, res) => {
	res.send(`<h1>Telnyx APIv2 Follow Me Demo is Running!</h1>`);
});

rest.post(`/${g_appName}/followme`, (req, res) => {
	if (req && req.body && req.body.data.event_type) {
		var l_hook_event_type = req.body.data.event_type;
		var l_call_control_id = req.body.data.payload.call_control_id;
		var l_client_state_64 = req.body.data.payload.client_state;
		var l_call_state = req.body.data.payload.state;
	} else {
		console.log(`[%s] LOG - Invalid Webhook received! ${get_timestamp()}`);
		res.end("0");
	}
	// l_bridge_id is the original caller that needs to be bridged on to the customers dial shold they choose to connect
	if (l_call_state == "parked") {
		l_bridge_id = l_call_control_id;
		console.log(
			`[%s] LOG - Webhook received - Parked call_control_id > bridge_id [%s] ${get_timestamp()} | ${l_bridge_id}`
		);
	}
	// If client_state exists decodes from base64 to ascii
	if (l_client_state_64 != null || "")
		var l_client_state_s = Buffer.from(
			l_client_state_64,
			"base64"
		).toString("ascii");
	// Log call_control_id
	console.log(
		`[%s] LOG - Webhook received - call_control_id [%s] ${get_timestamp()} | ${l_call_control_id}`
	);

	// Log_client_state
	console.log(
		`[%s] LOG - Webhook received - client_state [%s] ${get_timestamp()} | ${l_client_state_s}`
	);

	// Log for Call ID of the Origination Call that we will bridge - if the call is accepted
	console.log(
		`[%s] LOG - Webhook received - bridge_id [%s] ${get_timestamp()} | ${l_bridge_id}`
	);

	// Log Complete WebHook
	console.log(
		`[%s] DEBUG - Webhook received - complete payload: %s ${get_timestamp()} | ${JSON.stringify(
			req.body.data,
			null,
			4
		)}`
	);

	// Webhook Call State = Park >> Store Call Control ID >>> Bridge ID
	if (l_call_state == "parked") {
		l_bridge_id = l_call_control_id;
		console.log(
			`[%s] LOG - Webhook received - Parked call_control_id > bridge_id [%s] ${get_timestamp()} | ${l_bridge_id}`
		);
	}
	// Call Initiated >> Command Dial
	if (l_hook_event_type == "call.initiated") {
		console.log("initiate");
		if (req.body.data.payload.direction == "incoming") {
			console.log("incoming");
			call_control_dial(
				g_post_headers,
				g_connection_id,
				g_forwarding_did,
				req.body.data.payload.from,
				"stage-bridge"
			);
		} else if (req.body.data.payload.direction == "outgoing") {
			// Timeout 20 seconds - No Answer thus emppty message does not end up in cell phone voicemail
			console.log(`[%s] LOG - Time Out Set [%s] ${get_timestamp()} | ${l_bridge_id}`)
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

		// Webhook Dial answered by User - Command Gather Using Speak
	} else if (l_hook_event_type == "call.answered") {
		if (l_client_state_s == "stage-bridge")
			call_control_gather_using_speak(
				g_post_headers,
				l_call_control_id,
				`Call Forwarded press 1 to accept or 2 to reject`,
				"123",
				"stage-dial"
			);
		res.end();

		// Webhook Call Bridged >> Do Nothing
	} else if (l_hook_event_type == "call.bridged") {
		res.end();
		// Webhook Call Speak Started >> Do Nothing
	} else if (l_hook_event_type == "call.speak.started") {
		res.end();
		// Webhook Call Hangup >> Clear DTMF Call Control Options
	} else if (l_hook_event_type == "call.hangup") {
		g_call_control_options = [];
		res.end();
		// Webhook Listen for DTMF to execute Call Recording on Demand
	} else if (l_hook_event_type == "call.dtmf.received") {
		
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
					l_bridge_id
				);
				// Empty Array for use on next command
				g_call_control_options = [];
			}
			res.end();
		}
		res.end();
		// Webhook Gather Ended >> Process DTMF for IVR 
	} else if (l_hook_event_type == "call.gather.ended") {
		// Receive DTMF Number
		var l_dtmf_number = req.body.data.payload.digits;

		console.log(
			`[%s] DEBUG - RECEIVED DTMF [%s]${(get_timestamp(), l_dtmf_number)}`
		);

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
		// Webhook Speek Ended >> Record VoiceMail
	} else if (l_hook_event_type == "call.speak.ended") {
		call_control_record_start(
			g_post_headers,
			l_call_control_id
		);
		res.end();
		// Webhook Call Recording Saved >> Send Text Message of recording
	} else if (l_hook_event_type == "call.recording.saved") {
		//Send Text Message Alert for call recording
		sms_send_notification(g_post_headers);
		// Send Email with link to recording
		send_email(
			req.body.data.payload.recording_urls.mp3,
			g_smtp_user,
			g_smtp_pass,
			g_recordings_email
		).catch(console.error);
		res.end();
	}
});

// ================================================ RESTful Server Start ================================================

const PORT = 8081;
rest.listen(PORT, () => {
	console.log(
		`SERVER ${get_timestamp()} -  app listening at http://localhost:${PORT}/${g_appName}`
	);
});
