import { setProgressbarValue } from '../ui/progress-bar.js';
import { fetchTransactionsForAccount, fetchStakingRewardsForAccountAndPool } from '../storage/domainobjectstore.js';
import { findStakingPoolsInTransactions } from '../near/stakingpool.js';

customElements.define('earnings-report-config',
    class extends HTMLElement {
        constructor() {
            super();
            this.attachShadow({ mode: 'open' });
            this.readyPromise = this.loadHTML();
        }

        async loadHTML() {
            this.shadowRoot.innerHTML = await fetch(new URL('config.component.html', import.meta.url)).then(r => r.text());
            this.accountsTable = this.shadowRoot.querySelector('#accountsTable');
            
            this.shadowRoot.querySelector('#addAccountButton').onclick = () => this.addAccountRow();
            document.querySelectorAll('link').forEach(lnk => this.shadowRoot.appendChild(lnk.cloneNode()));

            this.shadowRoot.getElementById('loaddatabutton').addEventListener('click', async () => {
                setProgressbarValue(0);
                for (const account of this.getAccounts()) {
                    const transactions = await fetchTransactionsForAccount(account);
                    const stakingAccounts = await findStakingPoolsInTransactions(transactions);
                    for (const stakingAccount of stakingAccounts) {
                        await fetchStakingRewardsForAccountAndPool(account, stakingAccount);
                    }
                }
                setProgressbarValue(null);
                this.dispatchChangeEvent();
            });
            return this.shadowRoot;
        }

        dispatchChangeEvent() {
            this.dispatchEvent(new Event('change'));
        }

        addAccountRow(accountname) {
            const accountRowTemplate = this.shadowRoot.querySelector('#accountRowTemplate');
            this.accountsTable.appendChild(accountRowTemplate.content.cloneNode(true));
            const accountsRow = this.accountsTable.lastElementChild;
            const accountNameInput = accountsRow.querySelector('.accountname');
            if (accountname) {
                accountNameInput.value = accountname;
            }
            accountNameInput.addEventListener('change', (e) => this.dispatchChangeEvent());
            accountsRow.querySelector('.removeAccountButton').onclick = () => accountsRow.remove();
        }

        setAccounts(accountsArray) {
            accountsArray.forEach(accountname => this.addAccountRow(accountname));            
        }

        getAccounts() {
            return Array.from(this.accountsTable.querySelectorAll('.accountname')).map(e => e.value);
        }
    });
