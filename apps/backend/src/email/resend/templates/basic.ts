export interface BasicEmailTemplateDto {
  header?: string;
  body: string;
  button?: {
    text: string;
    url: string;
  };
}

export function getBasicTemplate(dto: BasicEmailTemplateDto) {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
  </head>
  <body
    style="
      background-color: rgb(250, 251, 251);
      font-family:
        ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji',
        'Segoe UI Symbol', 'Noto Color Emoji';
      font-size: 1rem;
      line-height: 1.5rem;
      padding-top: 60px;
      padding-bottom: 60px;
    "
  >
    <table
      align="center"
      width="100%"
      border="0"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
      style="background-color: rgb(255, 255, 255); padding: 45px; max-width: 37.5em"
    >
      <tbody>
        <tr style="width: 100%">
          <td>
            <img
              alt="LogDash Logo"
              height="75"
              src="https://dev.logdash.io/logo-light-horizontal.png"
              style="
                margin-left: auto;
                margin-right: auto;
                margin-top: 0px;
                margin-bottom: 30px;
                display: block;
                outline: none;
                border: none;
                text-decoration: none;
              "
              width="auto"
            />
            ${
              dto.header
                ? `<h1 style="margin-top: 0px; margin-bottom: 0px; text-align: center; line-height: 2rem">
              ${dto.header}
            </h1>`
                : ''
            }
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
            >
              <tbody>
                <tr>
                  <td>
                    <table
                      align="center"
                      width="100%"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                    >
                      <tbody style="width: 100%">
                        <tr style="width: 100%">
                          <p
                            style="
                              font-size: 1rem;
                              line-height: 1.5rem;
                              margin-top: 16px;
                              margin-bottom: 16px;
                              text-align: left;
                            "
                          >
                            ${dto.body}
                          </p>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
            ${
              dto.button
                ? `<table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="text-align: left; margin-top: 30px"
            >
              <tbody>
                <tr>
                  <td>
                    <a
                      style="
                        border-radius: 0.5rem;
                        background-color: #fa198b;
                        padding-left: 18px;
                        padding-right: 18px;
                        padding-top: 12px;
                        padding-bottom: 12px;
                        color: rgb(255, 255, 255);
                        line-height: 100%;
                        text-decoration: none;
                        display: inline-block;
                        max-width: 100%;
                        mso-padding-alt: 0px;
                      "
                      target="_blank"
                      href="${dto.button.url}"
                      ><span
                        ><!--[if mso
                          ]><i style="mso-font-width: 450%; mso-text-raise: 18" hidden
                            >&#8202;&#8202;</i
                          ><!
                        [endif]--></span
                      ><span
                        style="
                          max-width: 100%;
                          display: inline-block;
                          line-height: 90%;
                          mso-padding-alt: 0px;
                          mso-text-raise: 9px;
                        "
                        >${dto.button.text}</span
                      ><span
                        ><!--[if mso
                          ]><i style="mso-font-width: 450%" hidden>&#8202;&#8202;&#8203;</i><!
                        [endif]--></span
                      ></a
                    >
                  </td>
                </tr>
              </tbody>
            </table>`
                : ''
            }
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>`;
}
