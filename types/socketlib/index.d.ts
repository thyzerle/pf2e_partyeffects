export {};
declare global {
  class socketlib {
    static modules: any;
    static system: SocketlibSocket;
    static errors: typeof errors;
    static registerModule(moduleName: any): any;
    static registerSystem(systemId: any): SocketlibSocket;
  }

  class SocketlibSocket {
    constructor(moduleName: any, moduleType: any);
    functions: any;
    socketName: string;
    pendingRequests: any;
    register(name: any, func: any): void;
    executeAsGM(handler: any, ...args: any[]): Promise<any>;
    executeAsUser(handler: any, userId: any, ...args: any[]): Promise<any>;
    executeForAllGMs(handler: any, ...args: any[]): Promise<void>;
    executeForOtherGMs(handler: any, ...args: any[]): Promise<void>;
    executeForEveryone(handler: any, ...args: any[]): Promise<void>;
    executeForOthers(handler: any, ...args: any[]): Promise<void>;
    executeForUsers(
      handler: any,
      recipients: any,
      ...args: any[]
    ): Promise<void>;
    _sendRequest(handlerName: any, args: any, recipient: any): any;
    _sendCommand(handlerName: any, args: any, recipient: any): void;
    _sendResult(id: any, result: any): void;
    _sendError(id: any, type: any): void;
    _executeLocal(func: any, ...args: any[]): any;
    _resolveFunction(func: any): any[];
    _onSocketReceived(message: any, senderId: any): void;
    _handleRequest(message: any, senderId: any): Promise<void>;
    _handleResponse(message: any, senderId: any): void;
    _isResponseSenderValid(senderId: any, recipients: any): boolean;
  }
}
