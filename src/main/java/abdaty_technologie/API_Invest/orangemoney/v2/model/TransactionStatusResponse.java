package abdaty_technologie.API_Invest.orangemoney.v2.model;

/**
 * Modèle pour la réponse de vérification du statut de transaction Orange Money V2
 * Correspond à la réponse de l'endpoint /transactionstatus
 */
public class TransactionStatusResponse {
    
    private String status;      // SUCCESS, FAILED, PENDING, etc.
    private String orderId;     // ID de la commande
    private String txnid;       // ID de transaction Orange Money
    
    public TransactionStatusResponse() {}
    
    public TransactionStatusResponse(String status, String orderId, String txnid) {
        this.status = status;
        this.orderId = orderId;
        this.txnid = txnid;
    }
    
    // Getters et Setters
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public String getOrderId() {
        return orderId;
    }
    
    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }
    
    public String getTxnid() {
        return txnid;
    }
    
    public void setTxnid(String txnid) {
        this.txnid = txnid;
    }
    
    // Méthodes utilitaires
    public boolean isSuccess() {
        return "SUCCESS".equalsIgnoreCase(status);
    }
    
    public boolean isFailed() {
        if (status == null) return false;
        String s = status.trim().toUpperCase();
        return s.equals("FAILED") || s.equals("FAILURE") || s.equals("CANCELLED") || 
               s.equals("ERROR") || s.equals("CANCELED");
    }
    
    public boolean isPending() {
        if (status == null) return true; // Par défaut, considérer comme pending si pas de statut
        String s = status.trim().toUpperCase();
        return s.equals("PENDING") || s.equals("PROCESSING") || s.equals("INITIATED") || 
               s.equals("IN_PROGRESS") || s.equals("WAITING");
    }
    
    @Override
    public String toString() {
        return "TransactionStatusResponse{" +
                "status='" + status + '\'' +
                ", orderId='" + orderId + '\'' +
                ", txnid='" + txnid + '\'' +
                '}';
    }
}
