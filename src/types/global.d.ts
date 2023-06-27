import { StreamingEventTypes } from '../measurements/StreamingEventNames';

/* eslint-disable no-unused-vars */
interface Window {
  applandStreamingSdkVersion?: string;
  applandStreamingRawEventCallback?: (edgeNodeId: string | undefined, type: keyof StreamingEventTypes | 'event', ...event: any[]) => void;
}
declare global {
  interface Window {
    applandStreamingSdkVersion?: string;
    applandStreamingRawEventCallback?: (edgeNodeId: string | undefined, type: keyof StreamingEventTypes | 'event', ...event: any[]) => void;
  }
}
