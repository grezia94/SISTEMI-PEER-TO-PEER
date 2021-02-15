App = {
  web3Provider: null,
  contracts: {},

  init: async function() {
    // Load poltrone.
    $.getJSON('../poltrone.json', function(data) {
      var armchairRow = $('#armchairRow');
      var armchairTemplate = $('#armchairTemplate');

      for (i = 0; i < data.length; i ++) {
        armchairTemplate.find('.panel-title').text(data[i].name);
        armchairTemplate.find('img').attr('src', data[i].picture);
        armchairTemplate.find('.fila').text(data[i].fila);
        armchairTemplate.find('.n').text(data[i].n);
        
        armchairTemplate.find('.btn-prenot').attr('data-id', data[i].id);

        armchairRow.append(armchairTemplate.html());
      }
    });

    return await App.initWeb3();
  },

  initWeb3: async function() {
    // Browser moderni dapp...
if (window.ethereum) {
  App.web3Provider = window.ethereum;
  try {
    // Richiesta d'accesso all'account
    await window.ethereum.enable();
  } catch (error) {
    //accesso negato all'account dell'utente
    console.error("Accesso negato all'account")
  }
}
// I browser obsoleti di dapp...
else if (window.web3) {
  App.web3Provider = window.web3.currentProvider;
}
//Se non viene rilevata nessuna istanza web3, torna a Ganache
else {
  App.web3Provider = new Web3.providers.HttpProvider('http://localhost:9545');
}
web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function() {
    $.getJSON('Store.json', function(data) {
    
      //Si prende il file degli artefatti necessari del contratto e si crea un'istanza con truffle-contract
      var Prenotazione = data;
      App.contracts.Store = TruffleContract(Prenotazione);
    
      //Imposta il provider per il nostro contratto
      App.contracts.Store.setProvider(App.web3Provider);
    
      //Usare il contratto per recuperare e contrassegnare le poltrone prenotate
      return App.markPrenota();
    });

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-prenot', App.handlePrenota);
  },

  markPrenota: function(prenotazioni, account) {
    
    var pInstance;

    App.contracts.Store.deployed().then(function(instance) {
      pInstance = instance;
    
      return pInstance.getPrenotazione.call();
    }).then(function(prenotazioni) {
      for (i = 0; i < prenotazioni.length; i++) {
        if (prenotazioni[i] !== '0x0000000000000000000000000000000000000000') {
          $('.panel-arm').eq(i).find('button').text('Prenotazione effettuata!').attr('disabled', true);
        
        }
      }
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  handlePrenota: function(event) {
    event.preventDefault();

    var Id = parseInt($(event.target).data('id'));

    var pInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
    
      var account = accounts[0];
    
      App.contracts.Store.deployed().then(function(instance) {
        pInstance = instance;
    
        //Eseguire la prenotazione come transazione inviato da un account
        return pInstance.prenota(Id, {from: account});
      }).then(function(result) {
        return App.markPrenota();
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
