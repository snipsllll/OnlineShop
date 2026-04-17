import {Routes} from '@angular/router';
import {AboutUs} from './views/about-us/about-us';
import {AdminDashboard} from './views/admin-dashboard/admin-dashboard';
import {AdminShopSettings} from './views/admin-shop-settings/admin-shop-settings';
import {AdminOwnerSettings} from './views/admin-owner-settings/admin-owner-settings';
import {AdminUsers} from './views/admin-users/admin-users';
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
import {NotFound} from './views/not-found/not-found';
import {RouteParams} from './models/enums/RouteParams';
import {MyRoutes} from './models/enums/MyRoutes';
import {adminGuard, authGuard, ownerGuard} from './guards/admin.guard';

export const routes: Routes = [
  {path: '', redirectTo: 'home', pathMatch: 'full'},
  {path: `${MyRoutes.PRODUKTE_OVERVIEW}`, redirectTo: 'home', pathMatch: 'full'},

  // ── Public routes ─────────────────────────────────────────────
  {path: 'home', component: ProductsOverview},
  {path: `${MyRoutes.PRODUKT_DETAILS}/:${RouteParams.PRODUCT_ID}`, component: ProductDetails},
  {path: `${MyRoutes.WARENKORB}`, component: Warenkorb},
  {path: `${MyRoutes.ABOUT_US}`, component: AboutUs},
  {path: `${MyRoutes.DATENSCHUTZ}`, component: Datenschutz},
  {path: `${MyRoutes.AGB}`, component: Agb},
  {path: `${MyRoutes.WIDERRUFSRECHT}`, component: Widerrufsrecht},

  // ── Auth-required customer routes ─────────────────────────────
  {path: `${MyRoutes.ACCOUNT_SETTINGS}`, component: AccountSettings, canActivate: [authGuard]},
  {path: `${MyRoutes.FAVORITEN_LISTE}`, component: FavoritenListe, canActivate: [authGuard]},
  {path: `${MyRoutes.CHECKOUT}`, component: Checkout, canActivate: [authGuard]},
  {path: `${MyRoutes.PAYMENT_APPROVAL}`, component: PaymentApproval, canActivate: [authGuard]},
  {path: `${MyRoutes.BESTELLUNGEN_OVERVIEW}`, component: BestellungenOverview, canActivate: [authGuard]},
  {path: `${MyRoutes.BESTELLUNG_DETAILS}/:${RouteParams.BESTELLUNGS_ID}`, component: BestellungDetails, canActivate: [authGuard]},

  // ── Admin routes ──────────────────────────────────────────────
  {path: `${MyRoutes.ADMIN_DASHBOARD}`, component: AdminDashboard, canActivate: [adminGuard]},
  {path: `${MyRoutes.ADMIN_PRODUCTS_OVERVIEW}`, component: AdminProductsOverview, canActivate: [adminGuard]},
  {path: `${MyRoutes.ADMIN_PRODUCT_DETAILS}/:${RouteParams.PRODUCT_ID}`, component: AdminProductDetails, canActivate: [adminGuard]},
  {path: `${MyRoutes.ADMIN_BESTELLUNGEN_OVERVIEW}`, component: AdminBestellungenOverview, canActivate: [adminGuard]},
  {path: `${MyRoutes.ADMIN_BESTELLUNG_DETAILS}/:${RouteParams.BESTELLUNGS_ID}`, component: AdminBestellungDetails, canActivate: [adminGuard]},
  {path: `${MyRoutes.ADMIN_USERS}`, component: AdminUsers, canActivate: [adminGuard]},
  {path: `${MyRoutes.ADMIN_SHOP_SETTINGS}`, component: AdminShopSettings, canActivate: [adminGuard]},

  // ── Owner-only routes ─────────────────────────────────────────
  {path: `${MyRoutes.ADMIN_OWNER_SETTINGS}`, component: AdminOwnerSettings, canActivate: [ownerGuard]},

  // ── 404 catch-all ─────────────────────────────────────────────
  {path: '**', component: NotFound},
];
