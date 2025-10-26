/* Minimal Google Identity Services popup auth (no redirect_uri) */
(function(){
  // Public class on window
  class GooglePopupAuth {
    constructor(configUrlOrObject){
      this._configUrlOrObject = configUrlOrObject || './auth/config.json';
      this._client = null;
      this._token = null;
      this._scopes = null;
      this._clientId = null;
      this._gsiLoaded = false;
      this._loadPromise = null;
      this._configPromise = null;
      this._ensureSetup();
    }

    async _ensureSetup(){
      await this._loadConfig();
      await this._loadGSI();
      this._initClient();
    }

    async _loadConfig(){
      if (typeof this._configUrlOrObject === 'object') {
        this._clientId = this._configUrlOrObject.client_id;
        this._scopes = (this._configUrlOrObject.scopes || []).join(' ');
        return;
      }
      const res = await fetch(this._configUrlOrObject, {cache:'no-store'});
      if(!res.ok) throw new Error('Failed to load auth config.json');
      const cfg = await res.json();
      this._clientId = cfg.client_id;
      this._scopes = (cfg.scopes || []).join(' ');
    }

    _loadGSI(){
      if (this._gsiLoaded) return Promise.resolve();
      if (this._loadPromise) return this._loadPromise;
      this._loadPromise = new Promise((resolve, reject)=>{
        const s = document.createElement('script');
        s.src = 'https://accounts.google.com/gsi/client';
        s.async = true;
        s.defer = true;
        s.onload = ()=>{ this._gsiLoaded = true; resolve(); };
        s.onerror = ()=> reject(new Error('Failed to load Google Identity script'));
        document.head.appendChild(s);
      });
      return this._loadPromise;
    }

    _initClient(){
      if (!window.google || !google.accounts || !google.accounts.oauth2) return;
      this._client = google.accounts.oauth2.initTokenClient({
        client_id: this._clientId,
        scope: this._scopes,
        prompt: '',   // silent if possible; change to 'consent' to force
        callback: (resp)=>{
          if (resp && resp.access_token) {
            this._token = resp.access_token;
            document.dispatchEvent(new CustomEvent('ci:token', {detail: resp}));
          } else {
            document.dispatchEvent(new CustomEvent('ci:token_error', {detail: resp}));
          }
        }
      });
    }

    async signIn(){
      if (!this._client) await this._ensureSetup();
      return new Promise((resolve, reject)=>{
        const onOk = (e)=>{ cleanup(); resolve(e.detail); };
        const onErr = (e)=>{ cleanup(); reject(e.detail||new Error('Token error')); };
        const cleanup = ()=>{
          document.removeEventListener('ci:token', onOk);
          document.removeEventListener('ci:token_error', onErr);
        };
        document.addEventListener('ci:token', onOk);
        document.addEventListener('ci:token_error', onErr);
        try { this._client.requestAccessToken(); }
        catch(err){ cleanup(); reject(err); }
      });
    }

    async ensureToken(){
      if (this._token) return this._token;
      await this.signIn();
      return this._token;
    }

    getAccessToken(){ return this._token; }
  }

  window.GooglePopupAuth = GooglePopupAuth;
})();