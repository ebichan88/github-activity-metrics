import '@mdi/font/css/materialdesignicons.css';
import { createApp } from 'vue';
import { createVuetify } from 'vuetify';
import 'vuetify/styles';
import App from './App.vue';

const vuetify = createVuetify({
    icons: {
        defaultSet: 'mdi',
    },
});

createApp(App)
    .use(vuetify)
    .mount('#app');
