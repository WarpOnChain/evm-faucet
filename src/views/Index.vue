<template>
  <div id="app-root">
    <!-- HEADER -->
    <header class="app-header">
      <div class="logo">
        <img src="/logo.png" alt="WarpOnChain Logo" />
      </div>
      <nav class="app-nav">
        <a href="https://docs.warponchain.com/" target="_blank">Docs</a>
        <a href="https://bridge.warponchain.com/" target="_blank">Bridge</a>
        <a href="https://sepolia.warpscan.org/" target="_blank">Explorer</a>
        <a href="/faucet">Faucet</a>
      </nav>
      <a href="/portal" class="portal-btn">Enter Portal</a>
    </header>

    <!-- FAUCET CONTENT -->
    <v-container fill-height>
      <v-row justify="center" align="center">
        <v-card class="card" :loading="isAjax">
          <v-img
            src="/logo.png"
            width="330"
            style="object-fit: contain"
            contain
          ></v-img>
          <v-card-title>
            <span class="card-title">WarpOnchain Faucet</span>
          </v-card-title>

          <!-- Form -->
          <v-card-text v-show="state === 'form'">
            <div>
              <label>Address (Where to send the tokens.)</label>
              <qr-input
                v-model="address"
                placeholder="WarpOnchain Chain Address"
                class="dark-input"
              ></qr-input>
            </div>
            <div ref="captcha" class="captcha"></div>
            <div class="errors">
              <p v-for="(error, i) in errors" :key="i" class="error-msg">*{{ error }}</p>
            </div>
            <v-alert type="error" dense outlined class="beta-alert">
              This is a testnet faucet. Funds are not real.
            </v-alert>
            <v-btn
              class="submit"
              @click="onSubmit"
              block
              :loading="isAjax"
              depressed
              :disabled="!canSubmit"
            >
              REQUEST {{ dropAmount }} {{ assetName }}
            </v-btn>
          </v-card-text>

          <!-- Success -->
          <v-card-text v-show="state === 'success'">
            <p class="success-msg">Transfer successful</p>
            <label style="font-weight: bold">Transaction ID</label>
            <p>{{ txId }}</p>
            <v-btn @click="clear" depressed block>Start again</v-btn>
          </v-card-text>

          <!-- Error -->
          <v-card-text v-show="state === 'error'">
            <v-alert type="error" text class="resp-error">
              {{ responseError }}
              <br /><br />
              <p>Faucet is rate limited.<br />Please try again in 10 mins.</p>
            </v-alert>
            <v-btn @click="clear" depressed block>Try Again</v-btn>
          </v-card-text>
        </v-card>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import axios from "../axios";
import { QrInput } from "@avalabs/vue_components";
const Web3 = require("web3");
import Big from "big.js";

export default {
  components: {
    QrInput,
  },
  data() {
    return {
      errAddress: false,
      isAjax: false,
      address: "",
      errors: [],
      responseError: "",
      captchaResponse: "",
      state: "form",
      assetId: "",
      dropSize: Big(0),
      txId: "",
    };
  },
  methods: {
    clear() {
      this.captchaResponse = "";
      window.grecaptcha.reset();
      this.state = "form";
    },
    verifyAddress(addr) {
      return Web3.utils.isAddress(addr);
    },
    onSubmit() {
      this.errors = [];
      this.errAddress = false;

      this.captchaResponse = window.grecaptcha.getResponse();

      if (!this.address) {
        this.errors.push("Please enter a valid address.");
        this.errAddress = true;
      }

      if (!this.verifyAddress(this.address)) {
        this.errors.push("Invalid address");
        this.errAddress = true;
      }

      if (!this.captchaResponse) {
        this.errors.push("You must fill the captcha.");
      }

      if (this.errors.length === 0) {
        this.requestToken();
      }
    },
    onresponse(res) {
      this.isAjax = false;
      let data = res.data;
      if (data.status === "success") {
        this.state = "success";
        this.txId = data.message;
      } else {
        this.responseError = data.message;
        this.state = "error";
      }
      window.grecaptcha.reset();
    },
    requestToken() {
      this.isAjax = true;
      axios
        .post("/api/token", {
          "g-recaptcha-response": this.captchaResponse,
          address: this.address,
        })
        .then(this.onresponse)
        .catch(() => {
          this.onresponse({
            data: {
              status: "error",
              message: "Request timeout.",
            },
          });
        });
    },
  },
  created() {
    axios.get("/api/howmuch").then((res) => {
      this.dropSize = Big(res.data.dropSize);
    });

    axios.get("/api/assetid").then((res) => {
      this.assetId = res.data.assetId;
    });

    let query = this.$router.currentRoute.query;
    let addr = query["address"];
    if (addr && this.verifyAddress(addr)) {
      this.address = addr;
    }
  },
  mounted() {
    let parent = this;
    window.onloadCallback = function () {
      window.grecaptcha.render(parent.$refs.captcha, {
        sitekey: parent.captchaKey,
      });
    };
  },
  computed: {
    canSubmit() {
      return this.address.length > 8;
    },
    captchaKey() {
      return process.env.VUE_APP_CAPTCHA_SITE_KEY;
    },
    assetName() {
      return this.assetId;
    },
    dropAmount() {
      return this.dropSize.div(Math.pow(10, 18)).toFixed(4);
    },
  },
  destroyed() {
    window.grecaptcha.reset();
  },
};
</script>

<style>
/* Global dark background */
html, body, #app-root {
  margin: 0 !important;
  padding: 0 !important;
  min-height: 100vh;
  background: linear-gradient(180deg, #0b0f19 0%, #0a0a0f 100%) !important;
  color: #f0f0f0 !important;
  font-family: "Orbitron", sans-serif !important;
}

/* Header bar */
.app-header {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 12px 24px !important;
  background: rgba(17, 24, 39, 0.95) !important;
  position: sticky !important;
  top: 0 !important;
  width: 100%;
  z-index: 1000 !important;
}

.app-header .logo img {
  height: 40px !important;
}

.app-nav a {
  color: #e0e0e0 !important;
  margin: 0 15px !important;
  text-decoration: none !important;
  font-weight: 500 !important;
}
.app-nav a:hover {
  color: #3b82f6 !important;
}

.portal-btn {
  background: linear-gradient(90deg, #3b82f6, #06b6d4) !important;
  color: #fff !important;
  padding: 8px 16px !important;
  border-radius: 8px !important;
  font-weight: bold !important;
  text-decoration: none !important;
}
.portal-btn:hover {
  opacity: 0.9 !important;
}

/* Card style */
.card {
  margin: auto !important;
  text-align: left !important;
  width: 420px !important;
  background-color: #1e293b !important;
  color: #ffffff !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.7) !important;
  border-radius: 12px !important;
  padding: 20px !important;
}

.card-title {
  color: #ffffff !important;
  font-size: 24px !important;
}

/* Fix qr-input field */
.dark-input ::v-deep(.v-field) {
  background-color: #2d3748 !important;
  border-radius: 6px !important;
}
.dark-input ::v-deep(input) {
  color: #ffffff !important;
}
.dark-input ::v-deep(input::placeholder) {
  color: #9ca3af !important;
}

/* Alerts & small errors */
.beta-alert, .resp-error, .error-msg {
  color: #ff6666 !important;
}

.submit {
  text-transform: none !important;
  background: linear-gradient(90deg, #3b82f6, #06b6d4) !important;
  color: #ffffff !important;
}

.v-card-title, .v-card-text, .v-alert, label, span, p {
  color: #ffffff !important;
}

@media only screen and (max-width: 600px) {
  .card {
    width: 100% !important;
    height: auto !important;
    border-radius: 0 !important;
  }
}
</style>
