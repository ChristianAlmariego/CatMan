const nodemailer = require('nodemailer');

exports.sendEmail = function(jsonObject, to, bcc, subject, text) {
	
	var mailOptions = {
	    from: jsonObject.emailFrom, 
	    to: to, 
	    bcc: bcc,
	    subject: subject, 
	    text: text,
	};
	
	var transporter = nodemailer.createTransport({
	    host: jsonObject.smtpHost,
	    port: jsonObject.smtpPort,
	    secure: false,
		tls: {
			rejectUnauthorized: false
		}
	});
	
	transporter.sendMail(mailOptions, function(error, info){
		if (error) {
			console.log(error);
		} else {
			console.log('Email sent: ' + info.response);
		}
	});
}

exports.sendEmailAttachment = function(jsonObject, to, bcc, subject, text, attachment) {
	
	var mailOptions = {
	    from: jsonObject.emailFrom, 
	    to: to, 
	    bcc: bcc,
	    subject: subject, 
	    text: text,
	    attachments: attachment,
	};
	
	var transporter = nodemailer.createTransport({
	    host: jsonObject.smtpHost,
	    port: jsonObject.smtpPort,
	    secure: false,
		tls: {
			rejectUnauthorized: false
		}
	});
	
	transporter.sendMail(mailOptions, function(error, info){
		if (error) {
			console.log(error);
		} else {
			console.log('Email sent: ' + info.response);
		}
	});
}


exports.sendEmailStatusTable = function(jsonObject, to, bcc, subject, html) {
	
	var mailOptions = {
	    from: jsonObject.emailFrom, 
	    to: to, 
	    bcc: bcc,
	    subject: subject,
		html: html,
	};
	
	var transporter = nodemailer.createTransport({
	    host: jsonObject.smtpHost,
	    port: jsonObject.smtpPort,
	    secure: false,
		tls: {
			rejectUnauthorized: false
		}
	});
	
	transporter.sendMail(mailOptions, function(error, info){
		if (error) {
			console.log(error);
		} else {
			console.log('Email sent: ' + info.response);
		}
	});
}
