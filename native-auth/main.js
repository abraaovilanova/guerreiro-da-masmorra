/* Bundle isolado (Vite) só pra login nativo do Google no app Android via Capacitor.
   O jogo em si (index.html/www/index.html) não usa bundler nenhum — continua script
   solto — então esse arquivinho é compilado à parte e incluído como <script> comum
   em www/index.html. Ele expõe window.NativeGoogleAuth pro script clássico do jogo
   chamar sem precisar importar nada.
   No navegador (GitHub Pages) esse script nem é carregado: lá o login continua
   sendo feito por popup do Google, direto pelo SDK do Firebase via CDN. */
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

window.NativeGoogleAuth = {
  async signIn() {
    const result = await FirebaseAuthentication.signInWithGoogle();
    const idToken = result.credential && result.credential.idToken;
    if (!idToken) throw new Error('Login nativo não retornou idToken.');
    return idToken;
  },
  async signOut() {
    await FirebaseAuthentication.signOut();
  },
};
