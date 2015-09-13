#!/usr/bin/python

import smtplib
import email.mime.text

import pystache

import logging

SENDER = 'notify@btcsoccer.com'
SERVER = 'neomailbox.net'
USER   = 'tomas'
PASS   = ''

def sendmail(template, data, address, subject):

    try:
        logging.info('Sending mail to %s' % address)

        renderer = pystache.Renderer()
        html = renderer.render_path('../templates/' + template, data)

        msg = email.mime.text.MIMEText(html, 'html')
        msg['Subject'] = subject
        msg['From'] = 'BTC Soccer <'+SENDER+'>'
        msg['To'] = address

        server = smtplib.SMTP_SSL(SERVER, 465)
        server.login(USER, PASS)

        server.sendmail(SENDER, address, msg.as_string())
        server.quit()

    except Exception, e:
        logging.exception('Error sending email')



if __name__ == '__main__':
    sendmail('email_betslip.html', {}, 'tomas@tomasvdw.nl', 'Test')

