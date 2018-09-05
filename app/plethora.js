angular.module('Plethora', ['ui.router', 'chart.js', 'ngTable'])
    .constant('NAMESPACE', 'Plethora')
    .constant('API_KEY_PLACEHOLDER', '%%APIKEY%%')
    .constant('API_FROM_PLACEHOLDER', '%%APIFROM%%')
    .constant('API_TO_PLACEHOLDER', '%%APITO%%')
    .config(PlethoraConfig)
    .service('KeychainService', KeychainService)
    .service('MarketingAPIService', MarketingAPIService)
;

function PlethoraConfig($stateProvider, $urlRouterProvider, ChartJsProvider){
    $stateProvider
        .state({name: 'marketing', url: '/marketing', component: 'marketingApi'})
        .state({name: 'key', url: '/chave', component: 'loginComponent'})
    ;

    $urlRouterProvider.otherwise('/marketing');
}

KeychainService.$inject = ['NAMESPACE'];
function KeychainService(NAMESPACE){
    this.getKey = function(){
        return localStorage.getItem(NAMESPACE + ':Keychain:Key');
    };

    this.setKey = function(key){
        localStorage.setItem(NAMESPACE + ':Keychain:Key', key);
    };
}

MarketingAPIService.$inject = ['$q', '$http', 'API_KEY_PLACEHOLDER', 'KeychainService'];
function MarketingAPIService($q, $http, API_KEY_PLACEHOLDER, KeychainService){
    const vm = this;

    this.cache = null;
    this.timestamp = null;
    this.url = 'https://api.postgrain.com/intranet/api/marketingtrololo?app_key=%%APIKEY%%';

    this.fetch = function(force = false){
        if(!KeychainService.getKey()) return $q.reject('No API key provided.');

        if(!vm.cache || force){
            vm.cache = null;
            vm.timestamp = null;

            return $http.get(vm.url.replace(API_KEY_PLACEHOLDER, KeychainService.getKey()))
                        .then(function(response){
                            if(response.data.code && response.data.code === 'NOT_ALLOWED') return $q.reject('API key provided is invalid.');

                            vm.cache = response.data;
                            vm.timestamp = new Date();

                            return {
                                data: vm.cache,
                                timestamp: vm.timestamp
                            };
                        });
        } else{
            return $q.resolve({
                data: vm.cache,
                timestamp: vm.timestamp
            });
        }
    };
}


angular.module('Plethora').component('headerComponent', {
    template: `
        <div class="o-header__logo" ng-click="Header.goHome()">
            <svg height="30" width="30" viewBox="0 0 30 30">
                <defs><style>.cls-1{fill:#00afdd;fill-rule:evenodd;}</style></defs>
                <path class="cls-1" d="M4,0H15a4,4,0,0,1,4,4l-.1,11a4,4,0,0,1-4,4H4a4,4,0,0,1-4-4V4A4.13,4.13,0,0,1,4.15,0" transform="translate(0 0)"/>
                <path class="cls-1" d="M26.11,11H22l-.06,7a4,4,0,0,1-4.06,4H11L11,26A4,4,0,0,0,15,30H26a3.91,3.91,0,0,0,4-3.89V15A3.91,3.91,0,0,0,26.11,11Z" transform="translate(0 0)"/>
            </svg>
            <div class="o-header__logo-text">Plethora</div>
        </div>
        <div class="o-header__apis">
            <a class="o-header__apis-api" ng-repeat="api in Header.data.apis" ui-sref="{{api.state}}" ui-sref-active="active">{{api.name}}</a>
        </div>
        <div class="o-header__key" ng-click="Header.changeKey()">Chave: {{Header.data.key || 'Nenhuma'}}</div>
    `,
    controller: ['KeychainService', '$state', '$scope', function(KeychainService, $state, $scope){
        this.data = {
            key: KeychainService.getKey(),
            apis: [
                {name: 'Marketing', state: 'marketing'},
            ]
        };

        (()=>{
            if(!KeychainService.getKey()) $state.go('key');
        })();

        $scope.$on('KeychainService:key:set', (event, key)=>{
            this.data.key = key
        });

        this.goHome = function(){
            $state.go('marketing');
        };

        this.changeKey = function(){
            $state.go('key');
        }
    }],
    controllerAs: 'Header'
});

angular.module('Plethora').component('loginComponent', {
    template: `
        <div class="c-box">
            <h2>Autentique-se</h2>
            <p>Insira sua chave de acesso às APIs abaixo</p>
            <input type="text" placeholder="Chave de acesso" ng-model="$ctrl.data.key">
            <input type="submit" value="Salvar chave" ng-click="$ctrl.setKey($ctrl.data.key)">
        </div>
    `,
    controller: ['KeychainService', '$state', '$rootScope', function(KeychainService, $state, $rootScope){
        this.data = {
            key: KeychainService.getKey()
        };

        this.setKey = function(key){
            if(key){
                KeychainService.setKey(key);
                $rootScope.$broadcast('KeychainService:key:set', key);
                $state.go('marketing');
            }
        }
    }]
});

angular.module('Plethora').component('marketingApi', {
    template: `
        <div class="o-api__header"></div>
        <div class="o-api__content" ng-class="{'o-api__content--loading': !MarketingAPI.data.data}">
        
            <div class="c-stat-group row">
                <!--Contas-->
                <div class="c-stats col-md-12">
                    <div class="c-stats__header">
                        <div class="c-stats__header-title">Contas</div>
                        <div class="c-stats__header-update" ng-if="MarketingAPI.data.data">
                            Última atualização às {{MarketingAPI.data.timestamp | date:'H:mm'}}. <a class="p-api-update" href="#" ng-click="MarketingAPI.update()" ">Atualizar agora</a>
                        </div>
                        <div class="c-stats__header-update" ng-if="!MarketingAPI.data.data">
                            Carregando dados...
                        </div>
                    </div>
                    <div class="c-stats__body row">
                        <div class="c-stat col-md-3">
                            <div class="c-stat__value">{{MarketingAPI.data.data.contas.total | number}}</div>
                            <div class="c-stat__title">Total</div>
                        </div>
                        <div class="c-stat col-md-3">
                            <div class="c-stat__value">{{MarketingAPI.data.data.contas.hoje | number}}</div>
                            <div class="c-stat__title">Hoje</div>
                        </div>
                        <div class="c-stat col-md-3">
                            <div class="c-stat__value">{{MarketingAPI.data.data.contas.ontem | number}}</div>
                            <div class="c-stat__title">Ontem</div>
                        </div>
                        <div class="c-stat col-md-3">
                            <div class="c-stat__value">{{MarketingAPI.data.data.assinantes_statics.novos_cadastros_por_dia | number:0}}</div>
                            <div class="c-stat__title">Cadastros por dia</div>
                        </div>
                    </div>
                </div>
                <!--Contas-->
                
                <!--Assinantes-->
                <div class="c-stats col-md-12">
                    <div class="c-stats__header">
                        <div class="c-stats__header-title">Assinantes</div>
                    </div>
                    <div class="c-stats__body row">
                        <div class="c-stat col-md-3">
                            <div class="c-stat__value">{{MarketingAPI.data.data.assinantes | number}}</div>
                            <div class="c-stat__title">Total</div>
                        </div>
                        <div class="c-stat col-md-3">
                            <div class="c-stat__value">{{MarketingAPI.data.data.assinantes_statics.novos_por_dia | number}}</div>
                            <div class="c-stat__title">Novos por dia</div>
                        </div>
                        <div class="c-stat col-md-3">
                            <div class="c-stat__value">{{MarketingAPI.data.data.assinantes_statics.deixam_por_dia | number}}</div>
                            <div class="c-stat__title">Saindo por dia</div>
                        </div>
                        <div class="c-stat col-md-3">
                            <div class="c-stat__value">{{MarketingAPI.data.data.conversao_total | number}}%</div>
                            <div class="c-stat__title">Conversão total</div>
                        </div>
                    </div>
                </div>
                <!--Assinantes-->
                
                <!--Campanhas hoje-->
                <div class="c-stats col-md-6 col-md">
                    <div class="c-stats__header">
                        <div class="c-stats__header-title">Campanhas</div>
                        <div class="c-stats__header-subtitle">Hoje</div>
                    </div>
                    <div class="c-stats__body c-stats__body--table c-stats__body--minus-margin-left">
                        <table class="c-table" ng-table="MarketingAPI.data.campaignsToday"> 
                            <tr ng-repeat="row in $data"> 
                                <td data-title="'Campanha'" sortable="'name'">{{row.name}}</td>
                                <td data-title="'Quantidade'" sortable="'value'">{{row.value}}</td>
                            </tr>
                        </table>
                    </div>
                </div>
                <!--Campanhas hoje-->
                
                <!--Campanhas ontem-->
                <div class="c-stats col-md-6">
                    <div class="c-stats__header">
                        <div class="c-stats__header-title">Campanhas</div>
                        <div class="c-stats__header-subtitle">Ontem</div>
                    </div>
                    <div class="c-stats__body c-stats__body--table c-stats__body--minus-margin-right">
                        <table class="c-table" ng-table="MarketingAPI.data.campaignsYesterday"> 
                            <tr ng-repeat="row in $data"> 
                                <td data-title="'Campanha'" sortable="'name'">{{row.name}}</td>
                                <td data-title="'Quantidade'" sortable="'value'">{{row.value}}</td>
                            </tr>
                        </table>
                    </div>
                </div>
                <!--Campanhas ontem-->
                
                <!--Campanhas total-->
                <div class="c-stats col-md-12">
                    <div class="c-stats__header">
                        <div class="c-stats__header-title">Campanhas</div>
                        <div class="c-stats__header-subtitle">Todas</div>
                    </div>
                    <div class="c-stats__body c-stats__body--table c-stats__body--minus-margin-right c-stats__body--minus-margin-left">
                        <table class="c-table" ng-table="MarketingAPI.data.campaignConversions">
                            <tr ng-repeat="row in $data"> 
                                <td data-title="'Campanha'" filter="{name: 'text'}" sortable="'name'">{{row.name}}</td>
                                <td data-title="'Cadastros'" sortable="'registrations'">{{row.registrations | number}}</td>
                                <td data-title="'Conversões'" sortable="'conversions'">{{row.conversions | number}}</td>
                                <td data-title="'Porcentagem'" sortable="'percent'">{{row.percent || 0}}%</td>
                                <td data-title="'Total em R$'" sortable="'money'">{{row.money | currency}}</td>
                            </tr>
                        </table>
                    </div>
                </div>
                <!--Campanhas total-->
                
                <!--Outros-->
                <div class="c-stats col-md-12">
                    <div class="c-stats__header">
                        <div class="c-stats__header-title">Outros</div>
                    </div>
                    <div class="c-stats__body row">
                        <div class="c-stat col-md-3">
                            <div class="c-stat__value">{{MarketingAPI.data.data.pagantes | number}}</div>
                            <div class="c-stat__title">Total de pagantes</div>
                        </div>
                        <div class="c-stat col-md-3">
                            <div class="c-stat__value">{{MarketingAPI.data.data.total_instagram_accounts | number}}</div>
                            <div class="c-stat__title">Contas do Instagram</div>
                        </div>
                        <div class="c-stat col-md-3">
                            <div class="c-stat__value">{{MarketingAPI.data.data.total_channels | number}}</div>
                            <div class="c-stat__title">Total de canais</div>
                        </div>
                        <div class="c-stat col-md-3">
                            <div class="c-stat__value">{{MarketingAPI.data.data.total_social | number}}</div>
                            <div class="c-stat__title">Total social</div>
                        </div>
                    </div>
                </div>
                <!--Outros-->
            </div>
            
        </div>
    `,
    controller: ['MarketingAPIService', 'NgTableParams', '$state', function(MarketingAPIService, NgTableParams, $state){
        const vm = this;

        this.data = {
            data: null,
            timestamp: null,
            campaignsToday: null,
            campaignsYesterday: null,
            campaignConversions: null
        };

        (()=>{
            MarketingAPIService.fetch().then(function(response){
                updateData(response);
            }).catch(function(){
                $state.go('key');
            });
        })();

        this.update = function(){
            if(vm.data.data){
                vm.data.data = null;
                vm.data.timestamp = null;
                vm.data.campaignsToday.settings({dataset: []});
                vm.data.campaignsToday.reload({});
                vm.data.campaignsYesterday.settings({dataset: []});
                vm.data.campaignsYesterday.reload();
                vm.data.campaignConversions.settings({dataset: []});
                vm.data.campaignConversions.reload();

                MarketingAPIService.fetch(true).then(function(response){
                    updateData(response);
                });
            }
        };

        function updateData(response){
            vm.data.data = response.data;
            vm.data.timestamp = response.timestamp;

            // Campaigns
            let _campaignToday = [];
            let _campaignYesterday = [];

            for(let key in response.data.campaign_hoje){
                if(response.data.campaign_hoje.hasOwnProperty(key)) _campaignToday.push({name: key, value: response.data.campaign_hoje[key]});
            }
            for(let key in response.data.campaign_ontem){
                if(response.data.campaign_ontem.hasOwnProperty(key)) _campaignYesterday.push({name: key, value: response.data.campaign_ontem[key]});
            }

            vm.data.campaignsToday = new NgTableParams({sorting: {value: 'desc'}}, {dataset: _campaignToday, counts: []});
            vm.data.campaignsYesterday = new NgTableParams({sorting: {value: 'desc'}}, {dataset: _campaignYesterday, counts: []});

            // Campaign conversions
            let _campaignConversions = [];

            for(let key in response.data.campaign_convert){
                if(response.data.campaign_convert.hasOwnProperty(key)) _campaignConversions.push({
                    name: key,
                    conversions: response.data.campaign_convert[key].total_convertido || 0,
                    registrations: response.data.campaign_convert[key].total_cadastro || 0,
                    percent: response.data.campaign_convert[key].percent || 0,
                    money: response.data.campaign_convert[key].total_money || 0
                });
            }

            vm.data.campaignConversions = new NgTableParams({sorting: {conversions: 'desc'}}, {dataset: _campaignConversions, counts: []});
        }
    }],
    controllerAs: 'MarketingAPI'
});
