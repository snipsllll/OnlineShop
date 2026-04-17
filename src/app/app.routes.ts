import {Routes} from '@angular/router';
import {AboutUs} from './views/about-us/about-us';
import {AdminDashboard} from './views/admin-dashboard/admin-dashboard';
import {AccountSettings} from './views/account-settings/account-settings';
import {AdminBestellungDetails} from './views/admin-bestellung-details/admin-bestellung-details';
import {AdminBestellungenOverview} from './views/admin-bestellungen-overview/admin-bestellungen-overview';
import {AdminProductDetails} from './views/admin-product-details/admin-product-details';
import {BestellungDetails} from './views/bestellung-details/bestellung-details';
import {BestellungenOverview} from './views/bestellungen-overview/bestellungen-overview';
import {Checkout} from './views/checkout/checkout';
import {FavoritenListe} from './views/favoriten-liste/favoriten-liste';
import {PaymentApproval} from './views/payment-approval/payment-approval';
import {ProductDetails} from './views/product-details/product-details';
import {AdminProductsOverview} from './views/admin-products-overview/admin-products-overview';
import {ProductsOverview} from './views/products-overview/products-overview';
import {Warenkorb} from './views/warenkorb/warenkorb';
import {Datenschutz} from './views/datenschutz/datenschutz';
import {Agb} from './views/agb/agb';
import {Widerrufsrecht} from './views/widerrufsrecht/widerrufsrecht';
import {RouteParams} from './models/enums/RouteParams';
import {MyRoutes} from './models/enums/MyRoutes';

export const routes: Routes = [
  {path: '', redirectTo: 'home', pathMatch: 'full'},
  {path: `${MyRoutes.PRODUKTE_OVERVIEW}`, redirectTo: 'home', pathMatch: 'full'},
  {path: `${MyRoutes.ABOUT_US}`, component: AboutUs},
  {path: `${MyRoutes.ADMIN_DASHBOARD}`, component: AdminDashboard},
  {path: `${MyRoutes.DATENSCHUTZ}`, component: Datenschutz},
  {path: `${MyRoutes.AGB}`, component: Agb},
  {path: `${MyRoutes.WIDERRUFSRECHT}`, component: Widerrufsrecht},
  {path: `${MyRoutes.ACCOUNT_SETTINGS}`, component: AccountSettings},
  {path: `${MyRoutes.ADMIN_BESTELLUNG_DETAILS}/:${RouteParams.BESTELLUNGS_ID}`, component: AdminBestellungDetails},
  {path: `${MyRoutes.ADMIN_BESTELLUNGEN_OVERVIEW}`, component: AdminBestellungenOverview},
  {path: `${MyRoutes.ADMIN_PRODUCT_DETAILS}/:${RouteParams.PRODUCT_ID}`, component: AdminProductDetails},
  {path: `${MyRoutes.ADMIN_PRODUCTS_OVERVIEW}`, component: AdminProductsOverview},
  {path: `${MyRoutes.BESTELLUNG_DETAILS}/:${RouteParams.BESTELLUNGS_ID}`, component: BestellungDetails},
  {path: `${MyRoutes.BESTELLUNGEN_OVERVIEW}`, component: BestellungenOverview},
  {path: `${MyRoutes.CHECKOUT}`, component: Checkout},
  {path: `${MyRoutes.FAVORITEN_LISTE}`, component: FavoritenListe},
  {path: `${MyRoutes.PAYMENT_APPROVAL}`, component: PaymentApproval},
  {path: `${MyRoutes.PRODUKT_DETAILS}/:${RouteParams.PRODUCT_ID}`, component: ProductDetails},
  {path: 'home', component: ProductsOverview},
  {path: `${MyRoutes.WARENKORB}`, component: Warenkorb}
];
