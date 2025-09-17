import React, { useState, useEffect, useReducer, useContext } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import SubscriptionModal from "../../components/SubscriptionModal";
import api from "../../services/api";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";

import moment from "moment";

const reducer = (state, action) => {
  if (action.type === "LOAD_INVOICES") {
    const invoices = action.payload.invoices || action.payload;
    const newInvoices = [];

    invoices.forEach((invoice) => {
      const invoiceIndex = state.findIndex((i) => i.id === invoice.id);
      if (invoiceIndex !== -1) {
        state[invoiceIndex] = invoice;
      } else {
        newInvoices.push(invoice);
      }
    });

    return [...state, ...newInvoices];
  }

  if (action.type === "UPDATE_INVOICES") {
    const invoice = action.payload;
    const invoiceIndex = state.findIndex((i) => i.id === invoice.id);

    if (invoiceIndex !== -1) {
      state[invoiceIndex] = invoice;
      return [...state];
    } else {
      return [invoice, ...state];
    }
  }

  if (action.type === "DELETE_INVOICE") {
    const invoiceId = action.payload;

    const invoiceIndex = state.findIndex((i) => i.id === invoiceId);
    if (invoiceIndex !== -1) {
      state.splice(invoiceIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
}));

const Invoices = () => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searchParam, ] = useState("");
  const [invoices, dispatch] = useReducer(reducer, []);
  const [storagePlans, setStoragePlans] = React.useState([]);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [isCompanyExpired, setIsCompanyExpired] = useState(false);

  // Verificar se a empresa está vencida
  useEffect(() => {
    if (user && user.company) {
      const hoje = moment();
      const vencimento = moment(user.company.dueDate);
      const isExpired = hoje.isAfter(vencimento);
      setIsCompanyExpired(isExpired);
    }
  }, [user]);

  const handleOpenContactModal = (invoices) => {
    setStoragePlans(invoices);
    setSelectedContactId(null);
    setContactModalOpen(true);
  };

  const handleCloseContactModal = () => {
    setSelectedContactId(null);
    setContactModalOpen(false);
  };
  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchInvoices = async () => {
        try {
          console.log("Buscando faturas...", { searchParam, pageNumber });
          const { data } = await api.get("/invoices/all", {
            params: { searchParam, pageNumber },
          });

          console.log("Dados recebidos:", data);
          dispatch({ type: "LOAD_INVOICES", payload: data });
          console.log("Dispatch realizado com payload:", data);
          setHasMore(data.hasMore);
          setLoading(false);
        } catch (err) {
          console.error("Erro ao buscar faturas:", err);
          toastError(err);
          setLoading(false);
        }
      };
      fetchInvoices();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber]);

  const loadMore = () => {
    setPageNumber((prevState) => prevState + 1);
  };

  const handleScroll = (e) => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore();
    }
  };

  const rowStyle = (record) => {
    const hoje = moment(moment()).format("DD/MM/yyyy");
    const vencimento = moment(record.dueDate).format("DD/MM/yyyy");
    var diff = moment(vencimento, "DD/MM/yyyy").diff(moment(hoje, "DD/MM/yyyy"));
    var dias = moment.duration(diff).asDays();
    if (dias < 0 && record.status !== "paid") {
      return { backgroundColor: "#ffbcbc9c" };
    }
  };

  const rowStatus = (record) => {
    const hoje = moment(moment()).format("DD/MM/yyyy");
    const vencimento = moment(record.dueDate).format("DD/MM/yyyy");
    var diff = moment(vencimento, "DD/MM/yyyy").diff(moment(hoje, "DD/MM/yyyy"));
    var dias = moment.duration(diff).asDays();
    const status = record.status;
    if (status === "paid") {
      return "Pago";
    }
    if (dias < 0) {
      return "Vencido";
    } else {
      return "Em Aberto"
    }
  }
  
  const renderUseWhatsapp = (row) => { return row.status === false ? "Não" : "Sim" };
  const renderUseFacebook = (row) => { return row.status === false ? "Não" : "Sim" };
  const renderUseInstagram = (row) => { return row.status === false ? "Não" : "Sim" };
  const renderUseCampaigns = (row) => { return row.status === false ? "Não" : "Sim" };
  const renderUseSchedules = (row) => { return row.status === false ? "Não" : "Sim" };
  const renderUseInternalChat = (row) => { return row.status === false ? "Não" : "Sim" };
  const renderUseExternalApi = (row) => { return row.status === false ? "Não" : "Sim" };

  return (
    <MainContainer>
      <SubscriptionModal
        open={contactModalOpen}
        onClose={handleCloseContactModal}
        aria-labelledby="form-dialog-title"
        Invoice={storagePlans}
        contactId={selectedContactId}

      ></SubscriptionModal>
      <MainHeader>
        <Title>Faturas ({invoices.length})</Title>
        {isCompanyExpired && (
          <div style={{ 
            backgroundColor: '#ffebee', 
            color: '#c62828', 
            padding: '10px', 
            borderRadius: '4px', 
            marginTop: '10px',
            border: '1px solid #ef9a9a'
          }}>
            <strong>Atenção:</strong> Sua assinatura está vencida. Entre em contato com o suporte para regularizar sua situação.
          </div>
        )}
      </MainHeader>
      <Paper
        className={classes.mainPaper}
        variant="outlined"
        onScroll={handleScroll}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              {/* <TableCell align="center">Id</TableCell> */}
              <TableCell align="center">Detalhes</TableCell>

              <TableCell align="center">Usuários</TableCell>
              <TableCell align="center">Conexões</TableCell>
              <TableCell align="center">Filas</TableCell>
              {/* <TableCell align="center">Whatsapp</TableCell>
              <TableCell align="center">Facebook</TableCell>
              <TableCell align="center">Instagram</TableCell> */}
              {/* <TableCell align="center">Campanhas</TableCell>
              <TableCell align="center">Agendamentos</TableCell>
              <TableCell align="center">Chat Interno</TableCell>
              <TableCell align="center">Rest PI</TableCell> */}

              <TableCell align="center">Valor</TableCell>
              <TableCell align="center">Data Venc.</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Ação</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <>
              {invoices.map((invoices) => (
                <TableRow style={rowStyle(invoices)} key={invoices.id}>
                  {/* <TableCell align="center">{invoices.id}</TableCell> */}
                  <TableCell align="center">{invoices.detail}</TableCell>

                  <TableCell align="center">{invoices.users}</TableCell>
                  <TableCell align="center">{invoices.connections}</TableCell>
                  <TableCell align="center">{invoices.queues}</TableCell>
                  {/* <TableCell align="center">{renderUseWhatsapp(invoices.useWhatsapp)}</TableCell>
                  <TableCell align="center">{renderUseFacebook(invoices.useFacebook)}</TableCell>
                  <TableCell align="center">{renderUseInstagram(invoices.useInstagram)}</TableCell> */}
                  {/* <TableCell align="center">{renderUseCampaigns(invoices.useCampaigns)}</TableCell>
                  <TableCell align="center">{renderUseSchedules(invoices.useSchedules)}</TableCell>
                  <TableCell align="center">{renderUseInternalChat(invoices.useInternalChat)}</TableCell>
                  <TableCell align="center">{renderUseExternalApi(invoices.useExternalApi)}</TableCell> */}

                  <TableCell style={{ fontWeight: 'bold' }} align="center">{invoices.value.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}</TableCell>
                  <TableCell align="center">{moment(invoices.dueDate).format("DD/MM/YYYY")}</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }} align="center">{rowStatus(invoices)}</TableCell>
                  <TableCell align="center">
                    {rowStatus(invoices) !== "Pago" ?
                      <Button
                        size="small"
                        variant="outlined"
                        color="secondary"
                        onClick={() => handleOpenContactModal(invoices)}
                      >
                        PAGAR
                      </Button> :
                      <Button
                        size="small"
                        variant="outlined"
                      // color="secondary"
                      >
                        PAGO
                      </Button>}

                  </TableCell>
                </TableRow>
              ))}
              {loading && <TableRowSkeleton columns={4} />}
            </>
          </TableBody>
        </Table>
      </Paper>
    </MainContainer>
  );
};

export default Invoices;
