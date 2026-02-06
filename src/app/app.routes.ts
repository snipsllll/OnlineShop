import {Routes} from '@angular/router';
import {AboutUs} from './views/about-us/about-us';
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
import {RouteParams} from './models/enums/RouteParams';
import {ViewUrls} from './models/enums/ViewUrls';

export const routes: Routes = [
  {path: '', redirectTo: 'home', pathMatch: 'full'},
  {path: `${ViewUrls.PRODUKTE_OVERVIEW}`, redirectTo: 'home', pathMatch: 'full'},
  {path: `${ViewUrls.ABOUT_US}`, component: AboutUs},
  {path: `${ViewUrls.ACCOUNT_SETTINGS}`, component: AccountSettings},
  {path: `${ViewUrls.ADMIN_BESTELLUNG_DETAILS}/:${RouteParams.BESTELLUNGS_ID}`, component: AdminBestellungDetails},
  {path: `${ViewUrls.ADMIN_BESTELLUNGEN_OVERVIEW}`, component: AdminBestellungenOverview},
  {path: `${ViewUrls.ADMIN_PRODUCT_DETAILS}/:${RouteParams.PRODUCT_ID}`, component: AdminProductDetails},
  {path: `${ViewUrls.ADMIN_PRODUCTS_OVERVIEW}`, component: AdminProductsOverview},
  {path: `${ViewUrls.BESTELLUNG_DETAILS}/:${RouteParams.BESTELLUNGS_ID}`, component: BestellungDetails},
  {path: `${ViewUrls.BESTELLUNGEN_OVERVIEW}`, component: BestellungenOverview},
  {path: `${ViewUrls.CHECKOUT}`, component: Checkout},
  {path: `${ViewUrls.FAVORITEN_LISTE}`, component: FavoritenListe},
  {path: `${ViewUrls.PAYMENT_APPROVAL}`, component: PaymentApproval},
  {path: `${ViewUrls.PRODUKT_DETAILS}/:${RouteParams.PRODUCT_ID}`, component: ProductDetails},
  {path: 'home', component: ProductsOverview},
  {path: `${ViewUrls.WARENKORB}`, component: Warenkorb}
];
