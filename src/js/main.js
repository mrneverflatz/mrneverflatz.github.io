import "../scss/styles.scss";

import Tab from "bootstrap/js/dist/tab";
import "bootstrap/js/dist/collapse";

const triggerTabList = document.querySelectorAll("#myTab button");
triggerTabList.forEach((triggerEl) => {
  const tabTrigger = new Tab(triggerEl);

  triggerEl.addEventListener("click", (event) => {
    event.preventDefault();
    // console.log(event.target.id);
    tabTrigger.show();
  });
});
