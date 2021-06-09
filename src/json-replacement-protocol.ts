import JsonReplacementComponent from "./json-replacement-component";

/**
 * JSON schema of the response for the web-app.
 * The web-app has the same interface to parse the
 * HTTP result of this service.
 */
 export default interface JsonReplacementProtocol{
    /**
     * A result message, which will be shown to the
     * web app user in a dialog box.
     */
    result: string;

    /**
     * A list of service recommendations
     */
    replacements: JsonReplacementComponent[];
}