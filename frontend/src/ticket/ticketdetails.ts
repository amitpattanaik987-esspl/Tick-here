import { loadContactModal } from "../components/contact-modal/contactModal.js";
import { loadFooter } from "../components/footer/footer.js";
import { loadLocationModal } from "../components/location-modal/locationModal.js";
import { loadNavbar } from "../components/navbar/navbar.js";


document.addEventListener("DOMContentLoaded",function () {
    loadFooter()
    loadNavbar()
    loadContactModal()
    loadLocationModal()
})